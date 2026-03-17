import ImageEditor from '@react-native-community/image-editor';
import ImageResizer from '@bam.tech/react-native-image-resizer';

export const TARGET_SIZE = 640;
const TARGET_HEIGHT_PX = TARGET_SIZE * 2; // 1280px = 2행

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: 상단 20% 제거
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 가로 모드 기준 상단 20%(하늘 영역)를 제외한 사용 영역 좌표를 반환합니다.
 * 9:16 사진 기준 (4000×2252): skipY = 450 → 사용 영역 4000×1802
 */
const getUsableRegion = (width: number, height: number) => {
  const skipY = Math.floor(height * 0.2);
  return {
    x: 0,
    y: skipY,
    width,
    height: height - skipY,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: 높이 1280px으로 리사이징
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 사용 영역을 높이 1280px 기준으로 리사이징합니다. (비율 유지)
 * 9:16 기준: scale = 1280 / 1802 ≈ 0.710 → 너비 2841px
 * 이 단계는 품질 손실 없이 진행합니다. (JPEG 100%)
 */
const resizeToTargetHeight = async (
  uri: string,
  regionWidth: number,
  regionHeight: number,
): Promise<{ uri: string; width: number; height: number }> => {
  const scale = TARGET_HEIGHT_PX / regionHeight;
  const scaledWidth = Math.round(regionWidth * scale);

  const resized = await ImageResizer.createResizedImage(
    uri,
    scaledWidth,
    TARGET_HEIGHT_PX,
    'JPEG',
    100, // 이 단계는 무손실 유지 (최종 압축은 Step 4에서)
    0,
    undefined,
    false,
  );

  return { uri: resized.uri, width: scaledWidth, height: TARGET_HEIGHT_PX };
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: 중앙 정렬 후 640×640 타일 좌표 계산
// ─────────────────────────────────────────────────────────────────────────────

interface TileConfig {
  row: number;
  col: number;
  offset: { x: number; y: number };
  size: { width: number; height: number };
}

/**
 * 리사이징된 이미지에서 640×640 타일의 절대 좌표 목록을 반환합니다.
 *
 * - 가로: floor(scaledWidth / 640) 개수만큼 타일 생성
 *         나머지 픽셀을 좌우 균등 버림 → 중앙 이미지 보존
 * - 세로: 1280 / 640 = 정확히 2행
 *
 * 예) scaledWidth=2841 → 4타일, 버림=281px → 좌140 / 우141
 */
const getTileCropConfigs = (scaledWidth: number): TileConfig[] => {
  const cols = Math.floor(scaledWidth / TARGET_SIZE);
  const usedWidth = cols * TARGET_SIZE;
  const discardTotal = scaledWidth - usedWidth;
  const offsetX = Math.floor(discardTotal / 2); // 좌측 버림량

  const rows = TARGET_HEIGHT_PX / TARGET_SIZE; // 항상 2

  const configs: TileConfig[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      configs.push({
        row,
        col,
        offset: {
          x: offsetX + col * TARGET_SIZE,
          y: row * TARGET_SIZE,
        },
        size: { width: TARGET_SIZE, height: TARGET_SIZE },
      });
    }
  }

  return configs;
};

// ─────────────────────────────────────────────────────────────────────────────
// 메인 처리 함수
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @function processAndEncodeImage
 * @description 원본 이미지를 아래 순서로 처리하여 640×640 JPEG URI 배열을 반환합니다.
 *
 * [Step 1] 상단 20%(하늘) 제거 → 크롭
 * [Step 2] 높이 1280px으로 리사이징 (2행 확보)
 * [Step 3] 가로 중앙 정렬 후 640×640 타일 분할
 * [Step 4] 각 타일 JPEG 60% 압축
 *
 * 9:16 사진(4000×2252) 기준 정상 결과: 8장 (4열×2행)
 *
 * @param fileUri     - Vision Camera 원본 파일 URI
 * @param imageWidth  - 원본 너비  (가로 모드 9:16: 4000)
 * @param imageHeight - 원본 높이  (가로 모드 9:16: 2252)
 * @returns 640×640 JPEG URI 배열
 */
export const processAndEncodeImage = async (
  fileUri: string,
  imageWidth: number,
  imageHeight: number,
): Promise<string[]> => {

  // Step 1: 상단 20% 크롭
  const usable = getUsableRegion(imageWidth, imageHeight);
  const step1 = await ImageEditor.cropImage(fileUri, {
    offset: { x: usable.x,    y: usable.y      },
    size:   { width: usable.width, height: usable.height },
  });

  // Step 2: 높이 1280px 리사이징
  const step2 = await resizeToTargetHeight(step1.uri, usable.width, usable.height);

  // Step 3: 타일 좌표 계산
  const tileConfigs = getTileCropConfigs(step2.width);

  console.log(
    `📐 원본 ${imageWidth}×${imageHeight}`,
    `→ 사용 영역 ${usable.width}×${usable.height}`,
    `→ 리사이즈 ${step2.width}×${step2.height}`,
    `→ 타일 ${tileConfigs.length}장 (${Math.floor(step2.width / TARGET_SIZE)}열×2행)`,
  );

  // Step 4: 타일별 크롭 + JPEG 60% 압축
  const results = await Promise.allSettled(
    tileConfigs.map(async (tile) => {
      const cropped = await ImageEditor.cropImage(step2.uri, {
        offset: tile.offset,
        size:   tile.size,
      });

      const compressed = await ImageResizer.createResizedImage(
        cropped.uri,
        TARGET_SIZE,
        TARGET_SIZE,
        'JPEG',
        60,
        0,
        undefined,
        false,
      );

      return compressed.uri;
    }),
  );

  const uris: string[] = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      uris.push(result.value);
    } else {
      console.error(
        `❌ 타일 [${tileConfigs[i].row}행, ${tileConfigs[i].col}열] 실패:`,
        result.reason,
      );
    }
  });

  return uris;
};