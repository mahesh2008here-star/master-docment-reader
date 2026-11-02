# ProGuard / R8 Rules for Paperwren / Master Documents

# Keep Room Database schemas and entities
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**

# Keep Kotlin Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}

# Keep Compose rules
-keep class androidx.compose.runtime.** { *; }

# Keep data models
-keep class com.paperwren.documentreader.data.model.** { *; }
-keepclassmembers class com.paperwren.documentreader.data.model.** { *; }

# Keep document engine
-keep class com.paperwren.documentreader.engine.** { *; }
