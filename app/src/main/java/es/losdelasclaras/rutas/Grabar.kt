package es.losdelasclaras.rutas

import android.Manifest
import android.annotation.SuppressLint
import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.net.Uri
import android.os.*
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.URLEncoder

/** Datos de la grabación: puntos en un archivo de texto (lat,lon,alt,ms por línea) y el estado en preferencias. */
object Grab {
    /* 9 nov 2026: aviso si te sales del track (más de 100 m). Modo guardado: "vs" vibrar y sonar (por defecto), "v" solo vibrar, "no" nada. */
    fun modoAviso(c: Context): String = prefs(c).getString("aviso_fuera", "vs") ?: "vs"
    fun avisar(c: Context, fuerte: Boolean) {
        val m = modoAviso(c); if (m == "no") return
        try { val v = c.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            val w = if (fuerte) longArrayOf(0, 500, 200, 500, 200, 500) else longArrayOf(0, 150, 120, 150)
            if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createWaveform(w, -1)) else @Suppress("DEPRECATION") v.vibrate(w, -1) } catch (e: Exception) {}
        // el pitido por el canal de alarma: se oye aunque las notificaciones estén en silencio
        if (m == "vs" && fuerte) try { val tg = android.media.ToneGenerator(android.media.AudioManager.STREAM_ALARM, 90)
            tg.startTone(android.media.ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 1600)
            Handler(Looper.getMainLooper()).postDelayed({ try { tg.release() } catch (e: Exception) {} }, 2200) } catch (e: Exception) {}
    }
    fun archivo(c: Context) = File(c.filesDir, "grabacion.txt")
    fun ultima(c: Context) = File(c.filesDir, "ultima.txt")
    fun prefs(c: Context) = c.getSharedPreferences("grabar", Context.MODE_PRIVATE)
    fun leer(f: File): List<DoubleArray> = if (!f.exists()) emptyList() else f.readLines().mapNotNull { l ->
        val v = l.split(","); if (v.size < 4) null else {
            val la = v[0].toDoubleOrNull(); val lo = v[1].toDoubleOrNull(); val al = v[2].toDoubleOrNull() ?: Double.NaN; val t = v[3].toDoubleOrNull() ?: 0.0
            if (la == null || lo == null) null else doubleArrayOf(la, lo, al, t) } }
    /** Enlace de la app con el track (…/rutas/#t=<polilínea>!<nombre>), como «Abrir con». */
    fun enlace(pts: List<DoubleArray>, nombre: String): String? {
        if (pts.size < 2) return null
        val s = Poli.simplificar(pts.map { doubleArrayOf(it[0], it[1]) }, 5.0)
        return "https://losdelasclaras.github.io/rutas/?g=" + System.currentTimeMillis() + "#t=" + URLEncoder.encode(Poli.polilinea(s), "UTF-8") + "!" +
            URLEncoder.encode(nombre.take(80), "UTF-8").replace("+", "%20")
    }
}

/** Puntos guardados con 📍 en la pantalla de grabar: [nombre, lat, lon, alt, ms] en puntos.json (van en el GPX y a Mis puntos). */
object Puntos {
    private fun f(c: Context) = File(c.filesDir, "puntos.json")
    fun leer(c: Context): JSONArray = try { JSONArray(f(c).readText()) } catch (e: Exception) { JSONArray() }
    fun poner(c: Context, a: JSONArray) { f(c).writeText(a.toString()) }
    fun borrar(c: Context) { f(c).delete() }
}

/** Copia en Descargas › Los de las Claras (GPX), para no perder nunca un recorrido. */
fun guardarGpx(c: Context, pts: List<DoubleArray>, nombre: String, wps: JSONArray = JSONArray()): Pair<String, Uri>? {
    if (pts.size < 2) return null
    fun x(s: String) = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;")
    val iso = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.US).apply { timeZone = java.util.TimeZone.getTimeZone("UTC") }
    val sb = StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<gpx version=\"1.1\" creator=\"Los de las Claras\" xmlns=\"http://www.topografix.com/GPX/1/1\">\n")
    for (i in 0 until wps.length()) { val w = wps.optJSONArray(i) ?: continue
        sb.append("<wpt lat=\"${w.optDouble(1)}\" lon=\"${w.optDouble(2)}\">"); if (!w.isNull(3) && !w.optDouble(3).isNaN()) sb.append("<ele>${Math.round(w.optDouble(3))}</ele>")
        sb.append("<name>${x(w.optString(0, "Punto"))}</name>"); val nt = w.optString(6, ""); if (nt.isNotEmpty()) sb.append("<desc>${x(nt)}</desc>"); sb.append("</wpt>\n") }
    sb.append("<trk><name>${x(nombre)}</name><trkseg>\n")
    for (q in pts) { sb.append("<trkpt lat=\"${q[0]}\" lon=\"${q[1]}\">"); if (!q[2].isNaN()) sb.append("<ele>${Math.round(q[2])}</ele>"); if (q[3] > 0) sb.append("<time>${iso.format(java.util.Date(q[3].toLong()))}</time>"); sb.append("</trkpt>\n") }
    sb.append("</trkseg></trk>\n</gpx>\n")
    val arch = nombre.replace(Regex("[^\\p{L}\\p{N} _-]"), "").trim().replace(Regex("\\s+"), "-").ifEmpty { "recorrido" } + ".gpx"
    return try {
        if (Build.VERSION.SDK_INT >= 29) {
            val v = android.content.ContentValues().apply {
                put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, arch)
                put(android.provider.MediaStore.MediaColumns.MIME_TYPE, "application/gpx+xml")
                put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, "Download/Los de las Claras") }
            val u = c.contentResolver.insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, v) ?: return null
            c.contentResolver.openOutputStream(u)?.use { it.write(sb.toString().toByteArray()) }; Pair("Descargas › Los de las Claras › $arch", u)
        } else {
            val d = File(c.getExternalFilesDir(android.os.Environment.DIRECTORY_DOWNLOADS), arch); d.writeText(sb.toString())
            Pair(d.absolutePath, androidx.core.content.FileProvider.getUriForFile(c, "es.losdelasclaras.rutas.fileprovider", d)) }
    } catch (e: Exception) { null }
}

/** Buzón en Firestore (buzon/{código}): la grabadora deja ahí el recorrido y la web lo recoge y lo guarda en Mis tracks. */
object Buzon {
    private const val URL0 = "https://firestore.googleapis.com/v1/projects/losdelasclaras-rutas/databases/(default)/documents/buzon/"
    private const val KEY = "AIzaSyBzYlxsZhJVPJpCk0_EgxaplD7zWMOOg1I"
    private fun pend(c: Context) = File(c.filesDir, "pendientes.json")
    private fun pedir(url: String, metodo: String, cuerpo: String?): Pair<Int, String> {
        val k = java.net.URL(url).openConnection() as java.net.HttpURLConnection
        k.connectTimeout = 15000; k.readTimeout = 20000
        if (metodo == "PATCH") { k.requestMethod = "POST"; k.setRequestProperty("X-HTTP-Method-Override", "PATCH") } else k.requestMethod = metodo
        if (cuerpo != null) { k.doOutput = true; k.setRequestProperty("Content-Type", "application/json; charset=utf-8"); k.outputStream.use { it.write(cuerpo.toByteArray()) } }
        val code = k.responseCode
        val txt = try { (if (code < 400) k.inputStream else k.errorStream)?.bufferedReader()?.readText() ?: "" } catch (e: Exception) { "" }
        k.disconnect(); return Pair(code, txt)
    }
    /** Añade los recorridos al buzón (lee lo que haya y lo junta). */
    private fun subir(b: String, nuevos: JSONArray): Boolean {
        val url = URL0 + b + "?key=" + KEY
        val (c0, t0) = pedir(url, "GET", null)
        val todos = JSONArray()
        if (c0 == 200) try { val prev = JSONArray(JSONObject(t0).getJSONObject("fields").getJSONObject("j").getString("stringValue")); for (i in 0 until prev.length()) todos.put(prev.get(i)) } catch (e: Exception) {}
        else if (c0 != 404) return false
        for (i in 0 until nuevos.length()) todos.put(nuevos.get(i))
        var i0 = 0
        while (todos.toString().length > 900_000 && i0 < todos.length()) {
            val it = todos.optJSONObject(i0); val w = it?.optJSONArray("w")
            if (w != null) for (k in 0 until w.length()) { val q = w.optJSONArray(k); if (q != null && q.length() > 7 && q.optString(7).isNotEmpty()) q.put(7, "") }
            i0++ }
        val cuerpo = JSONObject().put("fields", JSONObject().put("j", JSONObject().put("stringValue", todos.toString()))
            .put("t", JSONObject().put("integerValue", System.currentTimeMillis().toString()))).toString()
        return pedir(url, "PATCH", cuerpo).first == 200
    }
    fun enviar(c: Context, pts: List<DoubleArray>, nombre: String, fin: (Boolean) -> Unit) = enviar(c, pts, nombre, JSONArray(), fin)
    fun enviar(c: Context, pts: List<DoubleArray>, nombre: String, wps: JSONArray, fin: (Boolean) -> Unit) {
        val a = JSONArray(); for (q in pts) a.put(JSONArray().put(q[0]).put(q[1]).put(q[3].toLong()).put(if (q[2].isNaN()) JSONObject.NULL else Math.round(q[2])))   // [lat, lon, ms, altura GPS]
        val item = JSONObject().put("n", nombre).put("t0", if (pts.isNotEmpty()) pts[0][3].toLong() else System.currentTimeMillis()).put("p", a)
        if (wps.length() > 0) item.put("w", wps)
        // primero a la lista de pendientes (por si no hay cobertura) y luego se intenta mandar todo
        synchronized(this) { val l = try { JSONArray(pend(c).readText()) } catch (e: Exception) { JSONArray() }; l.put(item); pend(c).writeText(l.toString()) }
        Thread { fin(mandar(c)) }.start()
    }
    @Synchronized private fun mandar(c: Context): Boolean {
        val b = c.getSharedPreferences("buzon", Context.MODE_PRIVATE).getString("b", null) ?: return false
        val f = pend(c); if (!f.exists()) return true
        val l = try { JSONArray(f.readText()) } catch (e: Exception) { return true }
        if (l.length() == 0) return true
        return try { if (subir(b, l)) { f.delete(); true } else false } catch (e: Exception) { false }
    }
    fun reintentar(c: Context) { if (pend(c).exists()) Thread { mandar(c) }.start() }
}

/** Servicio en primer plano: sigue grabando con la pantalla apagada (con la notificación «Grabando tu recorrido»). */
class GrabarService : Service(), LocationListener {
    private var lm: LocationManager? = null
    private var ultimo: Location? = null
    /* 9 nov 2026: aviso fuera del track aquí, en el servicio, para que funcione con la pantalla apagada */
    private var segCache = ""; private var segPts: List<DoubleArray> = emptyList()
    private var fuera = 0; private var avisado = false; private var ultAviso = 0L
    private fun puntosSeguir(): List<DoubleArray> {
        val p = Grab.prefs(this); val k = (p.getString("seguir", "") ?: "") + "|" + (p.getString("seguir2", "") ?: "")
        if (k == segCache) return segPts
        segCache = k; val out = ArrayList<DoubleArray>()
        for (j in listOf(p.getString("seguir", ""), p.getString("seguir2", ""))) try {
            val a = JSONObject(j ?: "").getJSONArray("t"); var prev: DoubleArray? = null
            for (i in 0 until a.length()) { val q = a.getJSONArray(i); val x = doubleArrayOf(q.getDouble(0), q.getDouble(1))
                if (prev != null) out.add(doubleArrayOf(prev[0], prev[1], x[0], x[1])); prev = x } } catch (e: Exception) {}
        segPts = out; return out
    }
    /** distancia en metros de un punto a un tramo (proyección plana local, de sobra para estas distancias) */
    private fun aTramo(la: Double, lo: Double, s: DoubleArray): Double {
        val k = Math.cos(Math.toRadians(la)) * 111320.0; val m = 110540.0
        val ax = (s[1] - lo) * k; val ay = (s[0] - la) * m; val bx = (s[3] - lo) * k; val by = (s[2] - la) * m
        val dx = bx - ax; val dy = by - ay; val l2 = dx * dx + dy * dy
        val t = if (l2 > 0) Math.max(0.0, Math.min(1.0, -(ax * dx + ay * dy) / l2)) else 0.0
        val px = ax + t * dx; val py = ay + t * dy; return Math.sqrt(px * px + py * py)
    }
    private fun mirarTrack(l: Location) {
        val ts = puntosSeguir(); if (ts.isEmpty()) { fuera = 0; avisado = false; return }
        var d = Double.MAX_VALUE; for (s in ts) { val x = aTramo(l.latitude, l.longitude, s); if (x < d) d = x }
        val ahora = System.currentTimeMillis()
        if (d > 100 && d <= 3000) { fuera++
            // aviso al salir (2 posiciones seguidas fuera) y, si sigues fuera, otra vez cada 3 minutos
            if (fuera >= 2 && (!avisado || ahora - ultAviso > 180000)) { avisado = true; ultAviso = ahora; Grab.avisar(this, true)
                notificar("⚠️ Te has salido del track (a ${Math.round(d)} m)") } }
        else if (d <= 60) { if (avisado) { Grab.avisar(this, false); notificar("✓ De vuelta en el track") }
            fuera = 0; avisado = false }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            "parar" -> { quitar(); if (Build.VERSION.SDK_INT >= 24) stopForeground(STOP_FOREGROUND_REMOVE) else @Suppress("DEPRECATION") stopForeground(true); stopSelf(); return START_NOT_STICKY }
            "pausa" -> { quitar(); notificar("En pausa"); return START_STICKY }
            else -> { notificar("Grabando tu recorrido"); pedir() }
        }
        return START_STICKY
    }

    private fun notificar(txt: String) {
        val nm = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= 26) nm.createNotificationChannel(NotificationChannel("grabar", "Grabar recorrido", NotificationManager.IMPORTANCE_LOW))
        val pi = PendingIntent.getActivity(this, 0, Intent(this, GrabarActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        @Suppress("DEPRECATION")
        val b = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, "grabar") else Notification.Builder(this)
        val n = b.setContentTitle("Los de las Claras").setContentText(txt).setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true).setContentIntent(pi).build()
        if (Build.VERSION.SDK_INT >= 29) startForeground(7, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION) else startForeground(7, n)
    }

    @SuppressLint("MissingPermission")
    private fun pedir() {
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) return
        val m = getSystemService(LOCATION_SERVICE) as LocationManager; lm = m
        try { m.removeUpdates(this) } catch (e: Exception) {}
        try { m.requestLocationUpdates(LocationManager.GPS_PROVIDER, 2000L, 4f, this, Looper.getMainLooper()) } catch (e: Exception) {}
    }
    private fun quitar() { try { lm?.removeUpdates(this) } catch (e: Exception) {} }

    override fun onLocationChanged(l: Location) {
        if (l.hasAccuracy() && l.accuracy > 40f) return
        val u = ultimo
        if (u != null && u.distanceTo(l) < 5f) return
        ultimo = l
        val alt = if (l.hasAltitude()) Math.round(l.altitude).toString() else ""
        Grab.archivo(this).appendText("${"%.6f".format(java.util.Locale.US, l.latitude)},${"%.6f".format(java.util.Locale.US, l.longitude)},$alt,${l.time}\n")
        try { mirarTrack(l) } catch (e: Exception) {}
    }
    @Deprecated("") override fun onStatusChanged(p: String?, s: Int, e: Bundle?) {}
    override fun onProviderEnabled(p: String) {}
    override fun onProviderDisabled(p: String) {}
    override fun onDestroy() { quitar(); super.onDestroy() }
}

/**
 * Pantalla de grabar y seguir (assets/grabar.html, a pantalla completa con el mapa).
 * La posición la da Android directamente (GPS y red del móvil), así que aquí siempre funciona aunque dentro de la web no llegue.
 * Los trozos del mapa topográfico se guardan en el móvil (files/teselas) y se ven sin cobertura.
 */
class GrabarActivity : Activity(), LocationListener, android.hardware.SensorEventListener {
    private var fotoCb: android.webkit.ValueCallback<Array<Uri>>? = null
    private var fotoCam: Uri? = null
    private var fotoFile: File? = null
    @Deprecated("Deprecated in Java")
    override fun onActivityResult(rq: Int, rs: Int, data: Intent?) {
        if (rq == 77) { val cb = fotoCb; fotoCb = null
            val cam = fotoFile?.takeIf { it.exists() && it.length() > 0 }?.let { fotoCam }
            val u: Uri? = if (rs != RESULT_OK) null else (data?.data ?: cam)
            cb?.onReceiveValue(if (u != null) arrayOf(u) else null); return }
        @Suppress("DEPRECATION") super.onActivityResult(rq, rs, data)
    }
    private lateinit var web: WebView
    private var empezarTrasPermiso = false
    private var lm: LocationManager? = null
    private var ultGps = 0L
    private val teselas by lazy { File(filesDir, "teselas").apply { mkdirs() } }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        web = WebView(this)
        web.settings.javaScriptEnabled = true; web.settings.domStorageEnabled = true
        web.webViewClient = object : WebViewClient() {
            // al terminar de cargar la página, se le manda ya la última posición conocida (antes se perdía si llegaba antes de cargar)
            override fun onPageFinished(v: WebView?, u: String?) { super.onPageFinished(v, u); mirar() }
            override fun shouldInterceptRequest(v: WebView?, r: WebResourceRequest?): WebResourceResponse? {
                val u = r?.url?.toString() ?: return null
                val k = teselaDe(u) ?: return null
                val f = tesela(k[0], k[1], k[2], k[3])
                if (!f.exists() || f.length() == 0L) bajarTesela(u, f)
                val tipo = if (k[0] == "topo") "image/png" else "image/jpeg"
                if (f.exists() && f.length() > 0) return WebResourceResponse(tipo, null, f.inputStream())
                // sin cobertura y sin esa tesela: se amplía un trozo de la de menos zoom que sí esté guardada (se ve algo borrosa, pero se ve)
                val r = recorte(k[0], k[1].toInt(), k[2].toInt(), k[3].toInt())
                return if (r != null) WebResourceResponse(tipo, null, java.io.ByteArrayInputStream(r))
                else WebResourceResponse(tipo, null, 404, "Sin cobertura", emptyMap(), java.io.ByteArrayInputStream(ByteArray(0)))
            }
        }
        // 📷 foto de un punto (3 nov): el <input type=file> de la página abre la cámara o la galería
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(v: WebView?, cb: android.webkit.ValueCallback<Array<Uri>>?, p: FileChooserParams?): Boolean {
                fotoCb?.onReceiveValue(null); fotoCb = cb
                val galeria = Intent(Intent.ACTION_GET_CONTENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE)
                val extra = mutableListOf<Intent>()
                try {
                    val d = File(cacheDir, "compartir").apply { mkdirs() }; val f = File(d, "foto-${System.currentTimeMillis()}.jpg"); fotoFile = f
                    fotoCam = androidx.core.content.FileProvider.getUriForFile(this@GrabarActivity, "es.losdelasclaras.rutas.fileprovider", f)
                    extra.add(Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE).putExtra(android.provider.MediaStore.EXTRA_OUTPUT, fotoCam)
                        .addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION))
                } catch (e: Exception) { fotoCam = null; fotoFile = null }
                val ch = Intent.createChooser(galeria, "Foto del punto").putExtra(Intent.EXTRA_INITIAL_INTENTS, extra.toTypedArray())
                return try { startActivityForResult(ch, 77); true } catch (e: Exception) { fotoCb = null; false }
            }
        }
        web.addJavascriptInterface(Puente(), "Nativo")
        setContentView(web)
        desdeIcono = intent?.getBooleanExtra("desdeIcono", false) == true
        datosDe(intent)
        web.loadUrl("file:///android_asset/grabar.html")
        Buzon.reintentar(this)
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) permisos()
    }
    private var desdeIcono = false
    override fun onNewIntent(i: Intent?) { super.onNewIntent(i); setIntent(i); desdeIcono = i?.getBooleanExtra("desdeIcono", false) == true; datosDe(i); web.evaluateJavascript("cargaSeguir();refresca();miraZona()", null) }
    override fun onResume() { super.onResume(); mirar(); brujula(true); try { web.evaluateJavascript("window.movilListo&&movilListo()", null) } catch (e: Exception) {} }   // al volver de un ajuste, la lista «Preparar el móvil» se pone al día
    override fun onPause() { super.onPause(); soltar(); brujula(false) }

    // ---------- brújula: hacia dónde mira el móvil (sensor de rotación), corregida al norte geográfico ----------
    private var sm: android.hardware.SensorManager? = null
    private var hayBrujula = false
    private var decl = 0f
    private var ultRumbo = -999f
    private var ultEnvio = 0L
    private val rm = FloatArray(9); private val ori = FloatArray(3)
    private fun brujula(on: Boolean) {
        val m = sm ?: (getSystemService(SENSOR_SERVICE) as android.hardware.SensorManager).also { sm = it }
        if (!on) { m.unregisterListener(this); return }
        val s = m.getDefaultSensor(android.hardware.Sensor.TYPE_ROTATION_VECTOR) ?: m.getDefaultSensor(android.hardware.Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR)
        hayBrujula = s != null
        if (s != null) m.registerListener(this, s, android.hardware.SensorManager.SENSOR_DELAY_UI)
    }
    override fun onSensorChanged(e: android.hardware.SensorEvent) {
        android.hardware.SensorManager.getRotationMatrixFromVector(rm, e.values)
        android.hardware.SensorManager.getOrientation(rm, ori)
        var g = Math.toDegrees(ori[0].toDouble()).toFloat() + decl
        // con la pantalla girada (apaisado) el norte del móvil cambia
        @Suppress("DEPRECATION") val rot = windowManager.defaultDisplay.rotation
        g += when (rot) { android.view.Surface.ROTATION_90 -> 90f; android.view.Surface.ROTATION_180 -> 180f; android.view.Surface.ROTATION_270 -> 270f; else -> 0f }
        g = ((g % 360f) + 360f) % 360f
        val ahora = System.currentTimeMillis(); val d = Math.abs(((g - ultRumbo + 540f) % 360f) - 180f)
        if (ahora - ultEnvio < 150 || d < 1.5f) return
        ultEnvio = ahora; ultRumbo = g
        web.evaluateJavascript("rumbo($g)", null)
    }
    override fun onAccuracyChanged(s: android.hardware.Sensor?, a: Int) {}

    /** La web pasa su «buzón» (…?b=CÓDIGO) y, al seguir, el track (extras «t» = [[lat,lon,alt]…] y «n» = nombre). */
    private fun datosDe(i: Intent?) {
        val b = i?.data?.getQueryParameter("b")
        if (b != null && Regex("[A-Za-z0-9]{12,40}").matches(b)) getSharedPreferences("buzon", MODE_PRIVATE).edit().putString("b", b).apply()
        val z = i?.getStringExtra("z")
        if (i?.data?.host == "zona" && z != null && Regex("^-?[\\d.]+(,-?[\\d.]+){3}$").matches(z))
            Grab.prefs(this).edit().putString("zona", JSONObject().put("z", z).put("n", i.getStringExtra("n") ?: "la zona").toString()).apply()
        val t = i?.getStringExtra("t")
        if (i?.data?.host == "seguir" && t != null) try {
            val a = JSONArray(t); if (a.length() >= 2)
            {   // si ya se sigue otro track, este queda pendiente: la pantalla pregunta si cambiarlo o añadirlo como secundario
                val nuevo = JSONObject().put("n", i.getStringExtra("n") ?: "Track").put("t", a).toString()
                val p = Grab.prefs(this); val ya = try { JSONObject(p.getString("seguir", "") ?: "") } catch (e: Exception) { null }
                val mismo = ya != null && ya.optString("n") == (i.getStringExtra("n") ?: "Track") && (ya.optJSONArray("t")?.length() ?: 0) == a.length()
                val mismo2 = try { JSONObject(p.getString("seguir2", "") ?: "").optString("n") == (i.getStringExtra("n") ?: "Track") } catch (e: Exception) { false }
                if (ya == null) p.edit().putString("seguir", nuevo).remove("seguir_nuevo").apply()
                // pedido con «➕ Añadir un segundo track» (hace menos de 10 min): entra directo como secundario
                else if (!mismo && System.currentTimeMillis() - p.getLong("anadir2", 0L) < 600000) { p.edit().putString("seguir2", nuevo).remove("seguir_nuevo").remove("anadir2").putBoolean("anadido2", true).apply() }
                else if (!mismo && !mismo2) p.edit().putString("seguir_nuevo", nuevo).apply()
            }
        } catch (e: Exception) {}
    }

    /** Mapas: topográfico (OpenTopoMap) y los del IGN (mapa ráster MTN y ortofoto PNOA), los mismos de la app. Cada uno en su carpeta. */
    private fun urlDe(capa: String, z: String, x: String, y: String, n: Int = 0) = when (capa) {
        "ign" -> "https://www.ign.es/wmts/mapa-raster?service=WMTS&request=GetTile&version=1.0.0&Format=image/jpeg&layer=MTN&style=default&tilematrixset=GoogleMapsCompatible&TileMatrix=$z&TileRow=$y&TileCol=$x"
        "orto" -> "https://www.ign.es/wmts/pnoa-ma?service=WMTS&request=GetTile&version=1.0.0&Format=image/jpeg&layer=OI.OrthoimageCoverage&style=default&tilematrixset=GoogleMapsCompatible&TileMatrix=$z&TileRow=$y&TileCol=$x"
        else -> "https://" + "abc"[n % 3] + ".tile.opentopomap.org/$z/$x/$y.png" }
    /** [capa, z, x, y] de una dirección de tesela, o null si no es de un mapa. */
    private fun teselaDe(u: String): List<String>? {
        Regex("^https://[abc]\\.tile\\.opentopomap\\.org/(\\d+)/(\\d+)/(\\d+)\\.png$").find(u)?.let { val (z, x, y) = it.destructured; return listOf("topo", z, x, y) }
        Regex("^https://www\\.ign\\.es/wmts/(mapa-raster|pnoa-ma)\\?.*TileMatrix=(\\d+)&TileRow=(\\d+)&TileCol=(\\d+)$").find(u)?.let {
            val (sv, z, y, x) = it.destructured; return listOf(if (sv == "pnoa-ma") "orto" else "ign", z, x, y) }
        return null }
    /** Trozo ampliado de una tesela guardada de menos zoom (hasta 6 niveles menos), o null si no hay ninguna. */
    private fun recorte(capa: String, z: Int, x: Int, y: Int): ByteArray? {
        for (dz in 1..6) { val zz = z - dz; if (zz < 0) break
            val f = tesela(capa, "$zz", "${x shr dz}", "${y shr dz}"); if (!f.exists() || f.length() == 0L) continue
            return try { val bm = BitmapFactory.decodeFile(f.path) ?: continue
                val n = 1 shl dz; val sz = bm.width / n; if (sz < 4) return null
                val parte = Bitmap.createBitmap(bm, (x and (n - 1)) * sz, (y and (n - 1)) * sz, sz, sz)
                val esc = Bitmap.createScaledBitmap(parte, bm.width, bm.height, true)
                val o = java.io.ByteArrayOutputStream(); esc.compress(if (capa == "topo") Bitmap.CompressFormat.PNG else Bitmap.CompressFormat.JPEG, 85, o); o.toByteArray()
            } catch (e: Exception) { null } }
        return null }
    /** Mapas (topo, ign, orto) que tienen guardado algo en ese sitio, a ese zoom o menos. */
    private fun capasCon(la: Double, lo: Double, z: Int): List<String> = listOf("topo", "ign", "orto").filter { cp ->
        (0..6).any { dz -> val zz = z - dz; if (zz < 0) false else { val n = 1 shl zz; val x = ((lo + 180) / 360 * n).toInt(); val r = Math.toRadians(la)
            val y = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n).toInt(); val f = tesela(cp, "$zz", "$x", "$y"); f.exists() && f.length() > 0 } } }
    private fun tesela(capa: String, z: String, x: String, y: String) = File(teselas, "$capa/$z/$x/$y" + if (capa == "topo") ".png" else ".jpg")
    private fun bajarTesela(u: String, f: File): Boolean = try {
        val k = java.net.URL(u).openConnection() as java.net.HttpURLConnection
        k.connectTimeout = 8000; k.readTimeout = 12000; k.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android) LosDeLasClaras-Rutas/1.0"); k.setRequestProperty("Referer", "https://losdelasclaras.github.io/rutas/")
        if (k.responseCode == 200) { f.parentFile?.mkdirs(); val tmp = File(f.path + ".tmp"); k.inputStream.use { i -> tmp.outputStream().use { i.copyTo(it) } }; tmp.renameTo(f); k.disconnect(); true }
        else { k.disconnect(); false }
    } catch (e: Exception) { false }

    // ---------- posición en directo (mientras se ve la pantalla) ----------
    @SuppressLint("MissingPermission")
    private fun mirar() {
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
            checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) return
        val m = getSystemService(LOCATION_SERVICE) as LocationManager; lm = m
        try { m.removeUpdates(this) } catch (e: Exception) {}
        // primero lo último que sepa el móvil (sale al momento), luego GPS y red
        var mejor: Location? = null
        for (pr in listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)) try { val l = m.getLastKnownLocation(pr)
            if (l != null && (mejor == null || l.time > mejor.time)) mejor = l } catch (e: Exception) {}
        mejor?.let { if (System.currentTimeMillis() - it.time < 24 * 3600000L) mandar(it) }
        try { m.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000L, 0f, this, Looper.getMainLooper()) } catch (e: Exception) {}
        try { m.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 3000L, 0f, this, Looper.getMainLooper()) } catch (e: Exception) {}
    }
    private fun soltar() { try { lm?.removeUpdates(this) } catch (e: Exception) {} }
    override fun onLocationChanged(l: Location) {
        // con GPS reciente, la de la red (menos precisa) no lo pisa
        if (l.provider == LocationManager.GPS_PROVIDER) ultGps = System.currentTimeMillis()
        else if (System.currentTimeMillis() - ultGps < 15000) return
        mandar(l)
    }
    private fun mandar(l: Location) {
        try { decl = android.hardware.GeomagneticField(l.latitude.toFloat(), l.longitude.toFloat(), l.altitude.toFloat(), System.currentTimeMillis()).declination } catch (e: Exception) {}
        // sin brújula: la flecha, hacia donde caminas
        if (!hayBrujula && l.hasBearing() && l.hasSpeed() && l.speed > 0.8f) web.evaluateJavascript("rumbo(${l.bearing})", null)
        val alt = if (l.hasAltitude()) l.altitude.toString() else "null"
        web.evaluateJavascript("pos(${l.latitude},${l.longitude},${if (l.hasAccuracy()) l.accuracy else 0f},$alt)", null)
    }
    @Deprecated("") override fun onStatusChanged(p: String?, s: Int, e: Bundle?) {}
    override fun onProviderEnabled(p: String) {}
    override fun onProviderDisabled(p: String) {}

    private fun permisos(): Boolean {
        val faltan = mutableListOf<String>()
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            faltan += Manifest.permission.ACCESS_FINE_LOCATION; faltan += Manifest.permission.ACCESS_COARSE_LOCATION }
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED)
            faltan += Manifest.permission.POST_NOTIFICATIONS
        if (faltan.isEmpty()) return true
        requestPermissions(faltan.toTypedArray(), 5); return false
    }
    override fun onRequestPermissionsResult(rc: Int, p: Array<out String>, r: IntArray) {
        super.onRequestPermissionsResult(rc, p, r)
        if (rc == 6) { if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) mirar()
            web.evaluateJavascript("window.movilListo&&movilListo()", null); return }
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) { mirar(); if (empezarTrasPermiso) arrancar() }
        else web.evaluateJavascript("sinPermiso()", null)
        empezarTrasPermiso = false
    }
    private fun servicio(accion: String?) {
        val i = Intent(this, GrabarService::class.java); if (accion != null) i.action = accion
        if (accion == "parar") { startService(i); return }
        if (Build.VERSION.SDK_INT >= 26) startForegroundService(i) else startService(i)
    }
    /** Mientras se graba, el icono tiene que llevar aquí: se cierra la app principal (la web) que quedaba detrás,
     *  así al tocar el icono Android no la trae a ella sino que arranca de nuevo y salta a esta pantalla. */
    private fun cerrarAppDetras() { try { val am = getSystemService(ACTIVITY_SERVICE) as ActivityManager
        for (t in am.appTasks) { val b = t.taskInfo.baseIntent.component?.className ?: continue
            if (!b.contains("Grabar") && (b.contains("LauncherActivity") || b.contains("WebActivity"))) t.finishAndRemoveTask() } } catch (e: Exception) {} }
    private fun hayAppDetras(): Boolean = try { (getSystemService(ACTIVITY_SERVICE) as ActivityManager).appTasks.any { val b = it.taskInfo.baseIntent.component?.className ?: ""
        b.contains("LauncherActivity") || b.contains("WebActivity") } } catch (e: Exception) { false }
    private fun arrancar() {
        val p = Grab.prefs(this)
        cerrarAppDetras()
        if (!p.getBoolean("activo", false)) { Grab.archivo(this).delete(); Puntos.borrar(this)
            p.edit().putBoolean("activo", true).putLong("t0", System.currentTimeMillis()).putLong("pau", 0).putLong("pz", 0).apply() }
        servicio(null); web.evaluateJavascript("refresca()", null)
    }

    inner class Puente {
        private val c get() = this@GrabarActivity
        @JavascriptInterface fun estado(): String { val p = Grab.prefs(c)
            return JSONObject().put("activo", p.getBoolean("activo", false)).put("t0", p.getLong("t0", 0)).put("pau", p.getLong("pau", 0))
                .put("pz", p.getLong("pz", 0)).put("ultima", Grab.ultima(c).exists()).toString() }
        @JavascriptInterface fun puntos(desde: Int): String {
            val a = JSONArray(); val l = Grab.leer(Grab.archivo(c))
            for (i in desde until l.size) { val q = l[i]; a.put(JSONArray().put(q[0]).put(q[1]).put(if (q[2].isNaN()) JSONObject.NULL else q[2]).put(q[3])) }
            return a.toString() }
        @JavascriptInterface fun empezar() = runOnUiThread { if (permisos()) arrancar() else empezarTrasPermiso = true }
        @JavascriptInterface fun pausa() = runOnUiThread { val p = Grab.prefs(c)
            if (p.getLong("pz", 0) == 0L) { p.edit().putLong("pz", System.currentTimeMillis()).apply(); servicio("pausa") }
            else { p.edit().putLong("pau", p.getLong("pau", 0) + System.currentTimeMillis() - p.getLong("pz", 0)).putLong("pz", 0).apply(); servicio(null) }
            web.evaluateJavascript("refresca()", null) }
        /** Termina: guarda una copia, el GPX (con los puntos) en Descargas y lo pasa a la app por el buzón. */
        @JavascriptInterface fun terminar(nombre: String) = runOnUiThread {
            servicio("parar")
            val f = Grab.archivo(c); val pts = Grab.leer(f)
            if (pts.size < 2) { Grab.prefs(c).edit().putBoolean("activo", false).remove("t0").remove("pau").remove("pz").apply(); f.delete()
                web.evaluateJavascript("cierra();refresca();aviso('No había nada grabado todavía (el GPS no había dado ningún punto).')", null); return@runOnUiThread }
            f.copyTo(Grab.ultima(c), true)
            try { f.copyTo(File(filesDir, "grabacion-" + System.currentTimeMillis() + ".txt"), true) } catch (e: Exception) {}
            val wps = Puntos.leer(c); Puntos.borrar(c)
            Grab.prefs(c).edit().putBoolean("activo", false).remove("t0").remove("pau").remove("pz").putString("nombre", nombre).putString("wps", wps.toString()).apply(); f.delete()
            hecho(pts, nombre, wps) }
        @JavascriptInterface fun tirar() = runOnUiThread { servicio("parar"); Grab.archivo(c).delete()
            Grab.prefs(c).edit().putBoolean("activo", false).remove("t0").remove("pau").remove("pz").apply()
            // los puntos no se tiran: pasan a la app igualmente
            val w = Puntos.leer(c); Puntos.borrar(c); if (w.length() > 0) Buzon.enviar(c, emptyList(), "Puntos", w) {}
            web.evaluateJavascript("refresca()", null) }
        @JavascriptInterface fun recuperar() = runOnUiThread {
            val p = Grab.prefs(c); val n = p.getString("nombre", "Recorrido grabado") ?: "Recorrido grabado"
            val w = try { JSONArray(p.getString("wps", "[]")) } catch (e: Exception) { JSONArray() }
            hecho(Grab.leer(Grab.ultima(c)), n, w, false) }
        /** Compartir el GPX guardado como archivo: WhatsApp, Wikiloc, correo… */
        @JavascriptInterface fun compartir() = runOnUiThread {
            val u = Grab.prefs(c).getString("uri", null) ?: return@runOnUiThread
            val i = Intent(Intent.ACTION_SEND).setType("application/gpx+xml").putExtra(Intent.EXTRA_STREAM, Uri.parse(u)).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            try { startActivity(Intent.createChooser(i, "Enviar el recorrido (GPX)")) } catch (e: Exception) {} }
        @JavascriptInterface fun bateria() = runOnUiThread {
            try { startActivity(Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:$packageName"))) }
            catch (e: Exception) { try { startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))) } catch (x: Exception) {} } }
        /* ---------- 9 nov 2026: «⚙️ Preparar el móvil para grabar» (móviles antiguos y marcas que cortan el GPS en segundo plano) ---------- */
        private fun tiene(x: String) = checkSelfPermission(x) == PackageManager.PERMISSION_GRANTED
        @JavascriptInterface fun movil(): String {
            val pm = getSystemService(POWER_SERVICE) as PowerManager; val lm = getSystemService(LOCATION_SERVICE) as LocationManager
            val gps = try { lm.isProviderEnabled(LocationManager.GPS_PROVIDER) } catch (e: Exception) { true }
            return JSONObject().put("sdk", Build.VERSION.SDK_INT).put("android", Build.VERSION.RELEASE).put("marca", Build.MANUFACTURER.lowercase()).put("modelo", Build.MODEL)
                .put("fina", tiene(Manifest.permission.ACCESS_FINE_LOCATION))
                .put("siempre", if (Build.VERSION.SDK_INT >= 29) tiene(Manifest.permission.ACCESS_BACKGROUND_LOCATION) else true)
                .put("notif", if (Build.VERSION.SDK_INT >= 33) tiene(Manifest.permission.POST_NOTIFICATIONS) else (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).areNotificationsEnabled())
                .put("bateria", sinBateria()).put("gps", gps).put("ahorro", pm.isPowerSaveMode).toString()
        }
        @JavascriptInterface fun pedirUbic() = runOnUiThread { requestPermissions(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION), 6) }
        /** «Permitir siempre»: en Android 10 sale como pregunta; desde el 11, Android lleva directo a la pantalla del permiso. */
        @JavascriptInterface fun pedirSiempre() = runOnUiThread {
            if (Build.VERSION.SDK_INT < 29) return@runOnUiThread
            if (!tiene(Manifest.permission.ACCESS_FINE_LOCATION)) { requestPermissions(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION), 6); return@runOnUiThread }
            try { requestPermissions(arrayOf(Manifest.permission.ACCESS_BACKGROUND_LOCATION), 6) } catch (e: Exception) { ajustesApp() } }
        @JavascriptInterface fun pedirNotif() = runOnUiThread {
            // la primera vez se pregunta; si ya se dijo que no, Android no vuelve a preguntar: se abre su pantalla de ajustes
            val pr = Grab.prefs(c)
            if (Build.VERSION.SDK_INT >= 33 && !tiene(Manifest.permission.POST_NOTIFICATIONS) && !pr.getBoolean("notif_pedida", false)) {
                pr.edit().putBoolean("notif_pedida", true).apply(); requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 6) }
            else try { startActivity(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, packageName)) } catch (e: Exception) { ajustesApp() } }
        @JavascriptInterface fun ajustesGps() = runOnUiThread { try { startActivity(Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)) } catch (e: Exception) {} }
        @JavascriptInterface fun ajustesAhorro() = runOnUiThread { try { startActivity(Intent(Settings.ACTION_BATTERY_SAVER_SETTINGS)) } catch (e: Exception) { ajustesApp() } }
        @JavascriptInterface fun ajustesApp() = runOnUiThread { try { startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))) } catch (e: Exception) {} }
        /** Pantallas propias de cada marca (inicio automático, segundo plano). Se prueba una a una; si ninguna existe, los ajustes de la app. */
        @JavascriptInterface fun ajustesMarca() = runOnUiThread {
            val l = listOf(
                "com.miui.securitycenter/com.miui.permcenter.autostart.AutoStartManagementActivity",
                "com.miui.powerkeeper/com.miui.powerkeeper.ui.HiddenAppsConfigActivity",
                "com.huawei.systemmanager/com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity",
                "com.huawei.systemmanager/com.huawei.systemmanager.optimize.process.ProtectActivity",
                "com.hihonor.systemmanager/com.hihonor.systemmanager.startupmgr.ui.StartupNormalAppListActivity",
                "com.coloros.safecenter/com.coloros.safecenter.permission.startup.StartupAppListActivity",
                "com.coloros.safecenter/com.coloros.safecenter.startupapp.StartupAppListActivity",
                "com.oppo.safe/com.oppo.safe.permission.startup.StartupAppListActivity",
                "com.vivo.permissionmanager/com.vivo.permissionmanager.activity.BgStartUpManagerActivity",
                "com.iqoo.secure/com.iqoo.secure.ui.phoneoptimize.BgStartUpManager",
                "com.oneplus.security/com.oneplus.security.chainlaunch.view.ChainLaunchAppListActivity",
                "com.samsung.android.lool/com.samsung.android.sm.battery.ui.BatteryActivity",
                "com.samsung.android.lool/com.samsung.android.sm.ui.battery.BatteryActivity",
                "com.asus.mobilemanager/com.asus.mobilemanager.MainActivity",
                "com.meizu.safe/com.meizu.safe.permission.SmartBGActivity",
                "com.letv.android.letvsafe/com.letv.android.letvsafe.AutobootManageActivity")
            val m = Build.MANUFACTURER.lowercase()
            val propias = l.filter { n -> val k = n.substringBefore('/')
                when { m.contains("xiaomi") || m.contains("redmi") || m.contains("poco") -> k.contains("miui")
                    m.contains("huawei") -> k.contains("huawei"); m.contains("honor") -> k.contains("honor") || k.contains("huawei")
                    m.contains("oppo") || m.contains("realme") -> k.contains("coloros") || k.contains("oppo")
                    m.contains("vivo") || m.contains("iqoo") -> k.contains("vivo") || k.contains("iqoo")
                    m.contains("oneplus") -> k.contains("oneplus") || k.contains("coloros"); m.contains("samsung") -> k.contains("samsung")
                    m.contains("asus") -> k.contains("asus"); m.contains("meizu") -> k.contains("meizu"); else -> false } }
            for (n in propias) { try { val i = Intent().setComponent(android.content.ComponentName.unflattenFromString(n)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    .putExtra("package_name", packageName).putExtra("package_label", getString(R.string.app_name))
                if (packageManager.resolveActivity(i, 0) != null) { startActivity(i); return@runOnUiThread } } catch (e: Exception) {} }
            ajustesApp() }
        @JavascriptInterface fun sinBateria(): Boolean = if (Build.VERSION.SDK_INT >= 23) (getSystemService(POWER_SERVICE) as PowerManager).isIgnoringBatteryOptimizations(packageName) else true
        /** 🏠: si esta pantalla se abrió sola desde el icono (porque se estaba grabando), detrás no está la app: se abre como al tocar el icono. */
        @JavascriptInterface fun volver() = runOnUiThread {
            if (desdeIcono || !hayAppDetras()) {
                Grab.prefs(c).edit().putLong("volver_t", System.currentTimeMillis()).apply()
                try { startActivity(packageManager.getLaunchIntentForPackage(packageName)!!.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (e: Exception) {}
            }
            finish() }
        /** Abrir fuera (Google Maps para «Cómo llegar»). */
        @JavascriptInterface fun abrir(u: String) = runOnUiThread { if (u.startsWith("https://")) try { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(u))) } catch (e: Exception) {} }
        // seguir
        @JavascriptInterface fun seguir(): String = Grab.prefs(c).getString("seguir", "") ?: ""
        @JavascriptInterface fun version(): String = try { packageManager.getPackageInfo(packageName, 0).versionName ?: "?" } catch (e: Exception) { "?" }
        @JavascriptInterface fun dejarSeguir() { Grab.prefs(c).edit().remove("seguir").remove("seguir_nuevo").apply() }
        // dos tracks: principal («seguir»), secundario («seguir2») y el que acaba de llegar mientras ya se seguía otro («seguir_nuevo»)
        /** «➕ Añadir un segundo track»: a la app a elegirlo; el próximo «▶ Seguir» entra como secundario. */
        @JavascriptInterface fun anadir2() = runOnUiThread { Grab.prefs(c).edit().putLong("anadir2", System.currentTimeMillis()).putLong("volver_t", System.currentTimeMillis()).apply()
            try { startActivity(packageManager.getLaunchIntentForPackage(packageName)!!.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (e: Exception) {} }
        @JavascriptInterface fun anadido2(): Boolean { val p = Grab.prefs(c); val v = p.getBoolean("anadido2", false); if (v) p.edit().remove("anadido2").apply(); return v }
        @JavascriptInterface fun seguir2(): String = Grab.prefs(c).getString("seguir2", "") ?: ""
        @JavascriptInterface fun nuevoSeguir(): String = Grab.prefs(c).getString("seguir_nuevo", "") ?: ""
        @JavascriptInterface fun ponSeguir(rol: String, json: String) { val e = Grab.prefs(c).edit().remove("seguir_nuevo")
            val k = when (rol) { "p" -> "seguir"; "s" -> "seguir2"; else -> null }
            if (k != null) { if (json.isBlank()) e.remove(k) else e.putString(k, json) }
            e.apply() }
        /** Zona elegida en el mapa de la app para guardarla sin cobertura (se lee una vez). */
        @JavascriptInterface fun zona(): String { val p = Grab.prefs(c); val z = p.getString("zona", "") ?: ""; p.edit().remove("zona").apply(); return z }
        @JavascriptInterface fun modoAviso(): String = Grab.modoAviso(c)
        @JavascriptInterface fun ponModoAviso(m: String) { if (m in listOf("vs", "v", "no")) Grab.prefs(c).edit().putString("aviso_fuera", m).apply() }
        /** aviso desde la pantalla (cuando no se graba o en pausa: entonces no lo hace el servicio) */
        @JavascriptInterface fun avisoFuera(fuerte: Boolean) = Grab.avisar(c, fuerte)
        @JavascriptInterface fun vibrar() { try { val v = getSystemService(VIBRATOR_SERVICE) as Vibrator
            if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 400, 200, 400), -1)) else @Suppress("DEPRECATION") v.vibrate(longArrayOf(0, 400, 200, 400), -1) } catch (e: Exception) {} }
        // puntos
        @JavascriptInterface fun nPuntos(): Int = Puntos.leer(c).length()
        @JavascriptInterface fun listaPuntos(): String = Puntos.leer(c).toString()
        /** Punto con icono, nota y foto (como en la app): [nombre, lat, lon, alt, ms, icono, nota, foto (jpeg en base64)] */
        @JavascriptInterface fun punto2(j: String): Boolean {
            val o = try { JSONObject(j) } catch (e: Exception) { return false }
            val al = o.optDouble("al", Double.NaN)
            val w = JSONArray().put(o.optString("n", "Punto").take(80)).put(o.getDouble("la")).put(o.getDouble("lo")).put(if (al.isNaN()) JSONObject.NULL else al).put(System.currentTimeMillis())
                .put(o.optString("ic", "otro").take(20)).put(o.optString("nota", "").take(1000)).put(o.optString("fo", ""))
            val l = Puntos.leer(c); l.put(w); Puntos.poner(c, l)
            if (!Grab.prefs(c).getBoolean("activo", false)) Buzon.enviar(c, emptyList(), "Puntos", JSONArray().put(w)) {}
            return true }
        @JavascriptInterface fun punto(n: String, la: Double, lo: Double, al: Double): Boolean {
            val w = JSONArray().put(n.take(80)).put(la).put(lo).put(if (al.isNaN()) JSONObject.NULL else al).put(System.currentTimeMillis())
            // grabando: se guarda para el GPX y se pasa a la app al terminar. Sin grabar: a la app ya (y se queda en el mapa de esta pantalla hasta grabar)
            val l = Puntos.leer(c); l.put(w); Puntos.poner(c, l)
            if (!Grab.prefs(c).getBoolean("activo", false)) Buzon.enviar(c, emptyList(), "Puntos", JSONArray().put(w)) {}
            return true }
        /** Cuántas de esas teselas faltan por guardar (para preguntar solo si hace falta y decir cuánto ocupa). */
        @JavascriptInterface fun capasCon(la: Double, lo: Double, z: Int): String = JSONArray(this@GrabarActivity.capasCon(la, lo, z)).toString()
        @JavascriptInterface fun faltan(lista: String): Int { val a = try { JSONArray(lista) } catch (e: Exception) { return 0 }
            return (0 until a.length()).count { val (cp, z, x, y) = a.getString(it).split("/"); val f = tesela(cp, z, x, y); !(f.exists() && f.length() > 0) } }
        // mapa sin cobertura: bajar la zona del track
        // ---------- mapas guardados: cada zona apunta sus teselas (zonas.json + zona-<id>.txt) para poder borrarla luego ----------
        private fun zf() = File(filesDir, "zonas.json")
        private fun zl(): JSONArray = try { JSONArray(zf().readText()) } catch (e: Exception) { JSONArray() }
        private fun claves(o: JSONObject): List<String> = try { File(filesDir, "zona-" + o.getString("id") + ".txt").readLines().filter { it.isNotBlank() } } catch (e: Exception) { emptyList() }
        private fun fichero(k: String): File? { val v = k.split("/"); return if (v.size == 4) tesela(v[0], v[1], v[2], v[3]) else null }
        private fun tamDir(d: File): Long = d.walkTopDown().filter { it.isFile }.sumOf { it.length() }
        /** Lista de zonas guardadas con lo que ocupan, y lo que ocupa todo (también lo que se ha ido viendo). */
        @JavascriptInterface fun zonas(): String {
            val a = zl(); val out = JSONArray()
            for (i in 0 until a.length()) { val o = a.getJSONObject(i); var b = 0L; for (k in claves(o)) b += fichero(k)?.length() ?: 0L
                out.put(JSONObject(o.toString()).put("b", b)) }
            return JSONObject().put("z", out).put("total", tamDir(teselas)).toString() }
        @JavascriptInterface fun borrarZona(id: String): Boolean {
            val a = zl(); val quedan = JSONArray(); var esta: JSONObject? = null
            for (i in 0 until a.length()) { val o = a.getJSONObject(i); if (o.optString("id") == id) esta = o else quedan.put(o) }
            val z = esta ?: return false
            // las teselas que también use otra zona guardada se quedan
            val otras = HashSet<String>(); for (i in 0 until quedan.length()) otras.addAll(claves(quedan.getJSONObject(i)))
            for (k in claves(z)) if (k !in otras) fichero(k)?.delete()
            File(filesDir, "zona-$id.txt").delete(); zf().writeText(quedan.toString()); return true }
        @JavascriptInterface fun borrarTodo() { teselas.deleteRecursively(); teselas.mkdirs(); val a = zl()
            for (i in 0 until a.length()) File(filesDir, "zona-" + a.getJSONObject(i).optString("id") + ".txt").delete(); zf().delete() }
        @JavascriptInterface fun bajar(lista: String) = bajar(lista, "Zona")
        @JavascriptInterface fun bajar(lista: String, nombre: String) { Thread {
            val a = try { JSONArray(lista) } catch (e: Exception) { return@Thread }
            // se apunta la zona (con su lista de teselas) aunque luego falte alguna
            try { val id = System.currentTimeMillis().toString(36)
                File(filesDir, "zona-$id.txt").writeText((0 until a.length()).joinToString("\n") { a.getString(it) })
                val cps = (0 until a.length()).map { a.getString(it).substringBefore("/") }.toSet()
                val cp = if (cps.size > 1) "varios" else cps.firstOrNull() ?: "topo"
                val l = zl(); l.put(JSONObject().put("id", id).put("n", nombre.take(80)).put("capa", cp).put("t", System.currentTimeMillis()).put("nt", a.length())); zf().writeText(l.toString())
            } catch (e: Exception) {}
            val falta = (0 until a.length()).map { a.getString(it) }.filter { k -> val (cp, z, x, y) = k.split("/"); val f = tesela(cp, z, x, y); !(f.exists() && f.length() > 0) }
            val t = a.length(); var h = t - falta.size; var mal = 0; var ultAviso = 0L
            if (falta.isEmpty()) { runOnUiThread { web.evaluateJavascript("bajando($t,$t,false)", null) }; return@Thread }
            for ((n, k) in falta.withIndex()) {
                val (cp, z, x, y) = k.split("/"); val ok = bajarTesela(urlDe(cp, z, x, y, n), tesela(cp, z, x, y))
                if (ok) h++ else mal++
                if (mal >= 10 && h == t - falta.size) { runOnUiThread { web.evaluateJavascript("sinRed()", null) }; return@Thread }
                if (System.currentTimeMillis() - ultAviso > 2500) { ultAviso = System.currentTimeMillis(); val hh = h; runOnUiThread { web.evaluateJavascript("bajando($hh,$t,true)", null) } }
                Thread.sleep(60)
            }
            runOnUiThread { web.evaluateJavascript("bajando($t,$t,true)", null) }
        }.start() }
    }

    /** Guarda el GPX en Descargas y enseña el resumen (sin abrir la app: así no se queda colgada). */
    private fun hecho(pts: List<DoubleArray>, nombre: String, wps: JSONArray, enviar: Boolean = true) {
        val r = guardarGpx(this, pts, nombre, wps)
        if (r == null) { web.evaluateJavascript("cierra();refresca();aviso('No he podido guardar el GPX en Descargas')", null); return }
        Grab.prefs(this).edit().putString("uri", r.second.toString()).putString("donde", r.first).putString("nombre", nombre).apply()
        val js = "hecho(" + JSONObject.quote(nombre) + "," + JSONObject.quote(r.first) + ",\u0001EST\u0001)"
        if (!enviar || getSharedPreferences("buzon", MODE_PRIVATE).getString("b", null) == null) { web.evaluateJavascript(js.replace("\u0001EST\u0001", if (enviar) "'sinbuzon'" else "'ok'"), null); return }
        web.evaluateJavascript(js.replace("\u0001EST\u0001", "'enviando'"), null)
        Buzon.enviar(this, pts, nombre, wps) { ok -> runOnUiThread { web.evaluateJavascript(js.replace("\u0001EST\u0001", if (ok) "'ok'" else "'pendiente'"), null) } }
    }
}

/** Enviar un GPX como archivo desde la web (Chrome no deja mandar .gpx): intent://gpx#Intent;scheme=ldcgpx;…;S.n=nombre.gpx;S.g=<gpx>;end */
class CompartirActivity : Activity() {
    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        val g = intent?.getStringExtra("g"); var n = intent?.getStringExtra("n") ?: "track.gpx"
        if (g == null || !g.contains("<gpx")) { finish(); return }
        n = n.replace(Regex("[^\\w.-]"), "-").take(70); if (!n.endsWith(".gpx")) n += ".gpx"
        try {
            val d = File(cacheDir, "compartir").apply { mkdirs(); listFiles()?.forEach { it.delete() } }
            val f = File(d, n); f.writeText(g)
            val u = androidx.core.content.FileProvider.getUriForFile(this, "es.losdelasclaras.rutas.fileprovider", f)
            val i = Intent(Intent.ACTION_SEND).setType("application/gpx+xml").putExtra(Intent.EXTRA_STREAM, u).putExtra(Intent.EXTRA_SUBJECT, n.removeSuffix(".gpx"))
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            startActivity(Intent.createChooser(i, "Enviar el GPX"))
        } catch (e: Exception) { android.widget.Toast.makeText(this, "No he podido preparar el GPX", android.widget.Toast.LENGTH_LONG).show() }
        finish()
    }
}
