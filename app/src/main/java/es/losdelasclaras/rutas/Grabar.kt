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
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.URLEncoder

/** Datos de la grabación: puntos en un archivo de texto (lat,lon,alt,ms por línea) y el estado en preferencias. */
object Grab {
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
        sb.append("<name>${x(w.optString(0, "Punto"))}</name></wpt>\n") }
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
class GrabarActivity : Activity(), LocationListener {
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
            override fun shouldInterceptRequest(v: WebView?, r: WebResourceRequest?): WebResourceResponse? {
                val u = r?.url?.toString() ?: return null
                val k = teselaDe(u) ?: return null
                val f = tesela(k[0], k[1], k[2], k[3])
                if (!f.exists() || f.length() == 0L) bajarTesela(u, f)
                val tipo = if (k[0] == "topo") "image/png" else "image/jpeg"
                return if (f.exists() && f.length() > 0) WebResourceResponse(tipo, null, f.inputStream())
                else WebResourceResponse(tipo, null, 404, "Sin cobertura", emptyMap(), java.io.ByteArrayInputStream(ByteArray(0)))
            }
        }
        web.webChromeClient = WebChromeClient()
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
    override fun onResume() { super.onResume(); mirar() }
    override fun onPause() { super.onPause(); soltar() }

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
                Grab.prefs(this).edit().putString("seguir", JSONObject().put("n", i.getStringExtra("n") ?: "Track").put("t", a).toString()).apply()
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
        mejor?.let { if (System.currentTimeMillis() - it.time < 30 * 60000) mandar(it) }
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
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) { mirar(); if (empezarTrasPermiso) arrancar() }
        else web.evaluateJavascript("sinPermiso()", null)
        empezarTrasPermiso = false
    }
    private fun servicio(accion: String?) {
        val i = Intent(this, GrabarService::class.java); if (accion != null) i.action = accion
        if (accion == "parar") { startService(i); return }
        if (Build.VERSION.SDK_INT >= 26) startForegroundService(i) else startService(i)
    }
    private fun arrancar() {
        val p = Grab.prefs(this)
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
        @JavascriptInterface fun sinBateria(): Boolean = if (Build.VERSION.SDK_INT >= 23) (getSystemService(POWER_SERVICE) as PowerManager).isIgnoringBatteryOptimizations(packageName) else true
        /** 🏠: si esta pantalla se abrió sola desde el icono (porque se estaba grabando), detrás no está la app: se abre como al tocar el icono. */
        @JavascriptInterface fun volver() = runOnUiThread {
            if (desdeIcono) {
                Grab.prefs(c).edit().putLong("volver_t", System.currentTimeMillis()).apply()
                try { startActivity(packageManager.getLaunchIntentForPackage(packageName)!!.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (e: Exception) {}
            }
            finish() }
        /** Abrir fuera (Google Maps para «Cómo llegar»). */
        @JavascriptInterface fun abrir(u: String) = runOnUiThread { if (u.startsWith("https://")) try { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(u))) } catch (e: Exception) {} }
        // seguir
        @JavascriptInterface fun seguir(): String = Grab.prefs(c).getString("seguir", "") ?: ""
        @JavascriptInterface fun version(): String = try { packageManager.getPackageInfo(packageName, 0).versionName ?: "?" } catch (e: Exception) { "?" }
        @JavascriptInterface fun dejarSeguir() { Grab.prefs(c).edit().remove("seguir").apply() }
        /** Zona elegida en el mapa de la app para guardarla sin cobertura (se lee una vez). */
        @JavascriptInterface fun zona(): String { val p = Grab.prefs(c); val z = p.getString("zona", "") ?: ""; p.edit().remove("zona").apply(); return z }
        @JavascriptInterface fun vibrar() { try { val v = getSystemService(VIBRATOR_SERVICE) as Vibrator
            if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 400, 200, 400), -1)) else @Suppress("DEPRECATION") v.vibrate(longArrayOf(0, 400, 200, 400), -1) } catch (e: Exception) {} }
        // puntos
        @JavascriptInterface fun nPuntos(): Int = Puntos.leer(c).length()
        @JavascriptInterface fun listaPuntos(): String = Puntos.leer(c).toString()
        @JavascriptInterface fun punto(n: String, la: Double, lo: Double, al: Double): Boolean {
            val w = JSONArray().put(n.take(80)).put(la).put(lo).put(if (al.isNaN()) JSONObject.NULL else al).put(System.currentTimeMillis())
            // grabando: se guarda para el GPX y se pasa a la app al terminar. Sin grabar: a la app ya (y se queda en el mapa de esta pantalla hasta grabar)
            val l = Puntos.leer(c); l.put(w); Puntos.poner(c, l)
            if (!Grab.prefs(c).getBoolean("activo", false)) Buzon.enviar(c, emptyList(), "Puntos", JSONArray().put(w)) {}
            return true }
        /** Cuántas de esas teselas faltan por guardar (para preguntar solo si hace falta y decir cuánto ocupa). */
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
                val cp = a.optString(0, "topo").substringBefore("/")
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
