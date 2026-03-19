# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# VisionCamera
-keep class com.mrousavy.camera.** { *; }
-keepclassmembers class com.mrousavy.camera.** { *; }

# Worklets
-keep class com.worklets.** { *; }
-keepclassmembers class com.worklets.** { *; }

# Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keepclassmembers class com.swmansion.reanimated.** { *; }

# React Native 기본
-keep class com.facebook.react.** { *; }
-keepclassmembers class com.facebook.react.** { *; }

# JNI / C++ 브릿지
-keepclasseswithmembernames class * {
    native <methods>;
}