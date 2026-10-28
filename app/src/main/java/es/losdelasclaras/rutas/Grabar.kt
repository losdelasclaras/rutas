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
import android.webkit.WebView
import android.webkit.WebViewClient
import com.google.androidbrowserhelper.trusted.LauncherActivity
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

/** Copia en Descargas › Los de las Claras (GPX), para no perder nunca un recorrido. */
fun guardarGpx(c: Context, pts: List<DoubleArray>, nombre: String): Pair<String, Uri>? {
    if (pts.size < 2) return null
    fun x(s: String) = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;")
    val iso = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.US).apply { timeZone = java.util.TimeZone.getTimeZone("UTC") }
    val sb = StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<gpx version=\"1.1\" creator=\"Los de las Claras\" xmlns=\"http://www.topografix.com/GPX/1/1\">\n<trk><name>${x(nombre)}</name><trkseg>\n")
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
    fun enviar(c: Context, pts: List<DoubleArray>, nombre: String, fin: (Boolean) -> Unit) {
        val a = JSONArray(); for (q in pts) a.put(JSONArray().put(q[0]).put(q[1]).put(q[3].toLong()))
        val item = JSONObject().put("n", nombre).put("t0", if (pts.isNotEmpty()) pts[0][3].toLong() else System.currentTimeMillis()).put("p", a)
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

/** Pantalla de grabar: una página local (assets/grabar.html) que habla con el servicio a través de «Nativo». */
class GrabarActivity : Activity() {
    private lateinit var web: WebView
    private var empezarTrasPermiso = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        web = WebView(this)
        web.settings.javaScriptEnabled = true; web.settings.domStorageEnabled = true
        web.webViewClient = WebViewClient(); web.webChromeClient = WebChromeClient()
        web.addJavascriptInterface(Puente(), "Nativo")
        setContentView(web)
        web.loadUrl("file:///android_asset/grabar.html")
        buzonDe(intent); Buzon.reintentar(this)
    }
    override fun onNewIntent(i: Intent?) { super.onNewIntent(i); buzonDe(i) }
    /** La web pasa su «buzón» (intent://grabar?b=CÓDIGO): ahí se deja la grabación para que la recoja la app. */
    private fun buzonDe(i: Intent?) { val b = i?.data?.getQueryParameter("b") ?: return
        if (Regex("[A-Za-z0-9]{12,40}").matches(b)) getSharedPreferences("buzon", MODE_PRIVATE).edit().putString("b", b).apply() }

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
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) { if (empezarTrasPermiso) arrancar() }
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
        if (!p.getBoolean("activo", false)) { Grab.archivo(this).delete(); p.edit().putBoolean("activo", true).putLong("t0", System.currentTimeMillis()).putLong("pau", 0).putLong("pz", 0).apply() }
        servicio(null); web.evaluateJavascript("refresca()", null)
    }

    inner class Puente {
        @JavascriptInterface fun estado(): String { val p = Grab.prefs(this@GrabarActivity)
            return JSONObject().put("activo", p.getBoolean("activo", false)).put("t0", p.getLong("t0", 0)).put("pau", p.getLong("pau", 0))
                .put("pz", p.getLong("pz", 0)).put("ultima", Grab.ultima(this@GrabarActivity).exists()).toString() }
        @JavascriptInterface fun puntos(desde: Int): String {
            val a = JSONArray(); val l = Grab.leer(Grab.archivo(this@GrabarActivity))
            for (i in desde until l.size) { val q = l[i]; a.put(JSONArray().put(q[0]).put(q[1]).put(if (q[2].isNaN()) JSONObject.NULL else q[2]).put(q[3])) }
            return a.toString() }
        @JavascriptInterface fun empezar() = runOnUiThread { if (permisos()) arrancar() else empezarTrasPermiso = true }
        @JavascriptInterface fun pausa() = runOnUiThread { val p = Grab.prefs(this@GrabarActivity)
            if (p.getLong("pz", 0) == 0L) { p.edit().putLong("pz", System.currentTimeMillis()).apply(); servicio("pausa") }
            else { p.edit().putLong("pau", p.getLong("pau", 0) + System.currentTimeMillis() - p.getLong("pz", 0)).putLong("pz", 0).apply(); servicio(null) }
            web.evaluateJavascript("refresca()", null) }
        /** Termina: guarda una copia, abre la app con el track y deja todo listo para la siguiente. */
        @JavascriptInterface fun terminar(nombre: String) = runOnUiThread {
            servicio("parar")
            val f = Grab.archivo(this@GrabarActivity); val pts = Grab.leer(f)
            if (pts.size < 2) { Grab.prefs(this@GrabarActivity).edit().clear().apply(); f.delete()
                web.evaluateJavascript("cierra();refresca();aviso('No había nada grabado todavía (el GPS no había dado ningún punto).')", null); return@runOnUiThread }
            // copia de seguridad (solo si hay recorrido: así nunca se pisa la anterior con una vacía)
            f.copyTo(Grab.ultima(this@GrabarActivity), true)
            try { f.copyTo(File(filesDir, "grabacion-" + System.currentTimeMillis() + ".txt"), true) } catch (e: Exception) {}
            Grab.prefs(this@GrabarActivity).edit().clear().putString("nombre", nombre).apply(); f.delete()
            hecho(pts, nombre) }
        @JavascriptInterface fun tirar() = runOnUiThread { servicio("parar"); Grab.archivo(this@GrabarActivity).delete(); Grab.prefs(this@GrabarActivity).edit().clear().apply(); web.evaluateJavascript("refresca()", null) }
        @JavascriptInterface fun recuperar() = runOnUiThread {
            val n = Grab.prefs(this@GrabarActivity).getString("nombre", "Recorrido grabado") ?: "Recorrido grabado"
            val pts = Grab.leer(Grab.ultima(this@GrabarActivity)); hecho(pts, n) }
        /** Compartir el GPX guardado: WhatsApp, Wikiloc, correo… o «Los de las Claras» para meterlo en la app. */
        @JavascriptInterface fun compartir() = runOnUiThread {
            val u = Grab.prefs(this@GrabarActivity).getString("uri", null) ?: return@runOnUiThread
            val i = Intent(Intent.ACTION_SEND).setType("application/gpx+xml").putExtra(Intent.EXTRA_STREAM, Uri.parse(u)).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            try { startActivity(Intent.createChooser(i, "Enviar el recorrido")) } catch (e: Exception) {} }
        @JavascriptInterface fun bateria() = runOnUiThread {
            try { startActivity(Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:$packageName"))) }
            catch (e: Exception) { try { startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))) } catch (x: Exception) {} } }
        @JavascriptInterface fun sinBateria(): Boolean = if (Build.VERSION.SDK_INT >= 23) (getSystemService(POWER_SERVICE) as PowerManager).isIgnoringBatteryOptimizations(packageName) else true
        @JavascriptInterface fun volver() = runOnUiThread { finish() }
    }

    /** Guarda el GPX en Descargas y enseña el resumen (sin abrir la app: así no se queda colgada). */
    private fun hecho(pts: List<DoubleArray>, nombre: String) {
        val r = guardarGpx(this, pts, nombre)
        if (r == null) { web.evaluateJavascript("cierra();refresca();aviso('No he podido guardar el GPX en Descargas')", null); return }
        Grab.prefs(this).edit().putString("uri", r.second.toString()).putString("donde", r.first).putString("nombre", nombre).apply()
        val js = "hecho(" + JSONObject.quote(nombre) + "," + JSONObject.quote(r.first) + ",\u0001EST\u0001)"
        if (getSharedPreferences("buzon", MODE_PRIVATE).getString("b", null) == null) { web.evaluateJavascript(js.replace("\u0001EST\u0001", "'sinbuzon'"), null); return }
        web.evaluateJavascript(js.replace("\u0001EST\u0001", "'enviando'"), null)
        Buzon.enviar(this, pts, nombre) { ok -> runOnUiThread { web.evaluateJavascript(js.replace("\u0001EST\u0001", if (ok) "'ok'" else "'pendiente'"), null) } }
    }

    private fun abrir(pts: List<DoubleArray>, nombre: String) {
        val url = Grab.enlace(pts, nombre)
        if (url == null) { web.evaluateJavascript("refresca();aviso('No ha dado tiempo a grabar nada')", null); return }
        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).setClass(this, LauncherActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        finish()
    }
}
