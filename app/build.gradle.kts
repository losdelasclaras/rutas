plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }
android {
    namespace = "es.losdelasclaras.rutas"
    compileSdk = 34
    defaultConfig {
        applicationId = "es.losdelasclaras.rutas"
        minSdk = 23; targetSdk = 34
        versionCode = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()
        versionName = "1." + (System.getenv("GITHUB_RUN_NUMBER") ?: "0")
    }
    signingConfigs { create("ldc") {
        storeFile = file("../ldc.keystore"); storePassword = "losdelasclaras"; keyAlias = "ldc"; keyPassword = "losdelasclaras"
    } }
    buildTypes { getByName("release") { isMinifyEnabled = false; signingConfig = signingConfigs.getByName("ldc") } }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
    lint { checkReleaseBuilds = false; abortOnError = false }
}
dependencies { implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.5.0") }
