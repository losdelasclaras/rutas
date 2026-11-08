package es.losdelasclaras.rutas

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import org.xmlpull.v1.XmlPullParser
import org.xmlpull.v1.XmlPullParserFactory
import java.net.URLEncoder
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.roundToInt

/**
 * Recibe un archivo GPX o KML («Abrir con» o «Compartir»), saca el recorrido y abre la app
 * con el enlace de track compartido (…/rutas/#t=<polilínea>!<nombre>), el mismo que usa la web.
 */
class AbrirActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val uri: Uri? = when (intent?.action) {
            Intent.ACTION_SEND -> @Suppress("DEPRECATION") (intent.getParcelableExtra(Intent.EXTRA_STREAM) as? Uri)
            else -> intent?.data
        }
        var url: String? = null
        try {
            if (uri != null) contentResolver.openInputStream(uri)?.use { url = enlace(leer(it)) }
        } catch (e: Exception) { }
        if (url == null) {
            Toast.makeText(this, "No he encontrado ningún recorrido en ese archivo (solo GPX o KML)", Toast.LENGTH_LONG).show()
        } else {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).setClass(this, WebActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK))
        }
        finish()
    }

    /** 8 nov 2026: el track llega entero a la app: alturas, horas y los puntos (wpt) del GPX. */
    private class Wp(var n: String, val la: Double, val lo: Double) { var e: Double? = null; var d = ""; var t: Long? = null }
    private class Track(val nombre: String, val pts: List<DoubleArray>, val wps: List<Wp>, val grab: Boolean)   // pts: [lat, lon, altura o NaN, ms o NaN]

    private fun hora(s: String): Long? = try {
        val f = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US).apply { timeZone = java.util.TimeZone.getTimeZone("UTC") }
        f.parse(s.trim().take(19))?.time } catch (e: Exception) { null }

    /** Lee trkpt / rtept (GPX) o coordinates de LineString (KML). Si hay varios tramos, los junta. */
    private fun leer(input: java.io.InputStream): Track {
        val p = XmlPullParserFactory.newInstance().apply { isNamespaceAware = false }.newPullParser()
        p.setInput(input, null)
        val pts = ArrayList<DoubleArray>(); val rte = ArrayList<DoubleArray>(); val wps = ArrayList<Wp>()
        var nombre = ""; var enTrk = false; var enLinea = false; var dentroCoord = false; var grab = false
        var cur: DoubleArray? = null; var w: Wp? = null
        var ev = p.eventType
        while (ev != XmlPullParser.END_DOCUMENT) {
            val tag = p.name?.substringAfter(':')?.lowercase()
            if (ev == XmlPullParser.START_TAG) {
                when (tag) {
                    "gpx" -> grab = (p.getAttributeValue(null, "creator") ?: "").contains("Los de las Claras")
                    "trk", "rte" -> enTrk = true
                    "trkpt", "rtept" -> {
                        val la = p.getAttributeValue(null, "lat")?.toDoubleOrNull(); val lo = p.getAttributeValue(null, "lon")?.toDoubleOrNull()
                        if (la != null && lo != null) { val q = doubleArrayOf(la, lo, Double.NaN, Double.NaN); (if (tag == "trkpt") pts else rte).add(q); cur = q }
                    }
                    "wpt" -> {
                        val la = p.getAttributeValue(null, "lat")?.toDoubleOrNull(); val lo = p.getAttributeValue(null, "lon")?.toDoubleOrNull()
                        if (la != null && lo != null) { w = Wp("Punto", la, lo); wps.add(w!!) }
                    }
                    "ele" -> { val v = p.nextText().trim().toDoubleOrNull(); if (v != null) { val c = cur; val ww = w; if (c != null) c[2] = v else if (ww != null) ww.e = v } }
                    "time" -> { val v = hora(p.nextText()); if (v != null) { val c = cur; val ww = w; if (c != null) c[3] = v.toDouble() else if (ww != null) ww.t = v } }
                    "desc", "cmt" -> { val ww = w; if (ww != null) { val t = p.nextText().trim(); if (t.isNotEmpty() && ww.d.isEmpty()) ww.d = t.take(1000) } }
                    "linestring" -> enLinea = true
                    "coordinates" -> dentroCoord = enLinea
                    "name" -> { val ww = w
                        if (ww != null) { val t = p.nextText().trim(); if (t.isNotEmpty()) ww.n = t.take(80) }
                        else if (nombre.isEmpty() || enTrk) { val t = p.nextText().trim(); if (t.isNotEmpty() && (nombre.isEmpty() || enTrk && pts.isEmpty())) nombre = t } }
                }
            } else if (ev == XmlPullParser.END_TAG) {
                when (tag) { "trk", "rte" -> enTrk = false; "linestring" -> enLinea = false; "coordinates" -> dentroCoord = false
                    "trkpt", "rtept" -> cur = null; "wpt" -> w = null }
            } else if (ev == XmlPullParser.TEXT && dentroCoord) {
                for (c in p.text.trim().split(Regex("\\s+"))) {
                    val v = c.split(","); if (v.size >= 2) { val lo = v[0].toDoubleOrNull(); val la = v[1].toDoubleOrNull()
                        val al = v.getOrNull(2)?.toDoubleOrNull()?.takeIf { it != 0.0 } ?: Double.NaN
                        if (la != null && lo != null) pts.add(doubleArrayOf(la, lo, al, Double.NaN)) }
                }
            }
            ev = p.next()
        }
        return Track(nombre.ifEmpty { "Track" }, if (pts.size >= 2) pts else rte, wps, grab)
    }

    private fun dist(a: DoubleArray, b: DoubleArray): Double { val r = Math.PI / 180; val dl = (b[0] - a[0]) * r; val dn = (b[1] - a[1]) * r
        val h = Math.sin(dl / 2).let { it * it } + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dn / 2).let { it * it }; return 12742000 * Math.asin(Math.min(1.0, Math.sqrt(h))) }

    private fun enlace(t: Track): String? {
        if (t.pts.size < 2) return null
        val s = simplificar(t.pts, 6.0)
        val conAlt = t.pts.all { !it[2].isNaN() }
        var m = 0.0; for (i in 1 until t.pts.size) { val d = dist(t.pts[i - 1], t.pts[i]); if (d < 2000) m += d }
        val x = org.json.JSONObject().put("a", if (conAlt) 1 else 0).put("g", if (t.grab) 1 else 0).put("km", Math.round(m / 100) / 10.0)
        // horas: inicio, fin y tiempo en movimiento (tramos de menos de 1 min y a más de 1 km/h), como la web
        val tt = t.pts.filter { !it[3].isNaN() }
        if (tt.size > 1) { var mov = 0.0; for (i in 1 until tt.size) { val dt = (tt[i][3] - tt[i - 1][3]) / 1000; if (dt > 0 && dt <= 60 && dist(tt[i - 1], tt[i]) / dt > 0.28) mov += dt }
            x.put("tm", org.json.JSONObject().put("a", tt.first()[3].toLong()).put("b", tt.last()[3].toLong()).put("m", mov.roundToInt())) }
        if (t.wps.isNotEmpty()) { val a = org.json.JSONArray()
            for (w in t.wps) a.put(org.json.JSONArray().put(w.n).put(Math.round(w.la * 1e5) / 1e5).put(Math.round(w.lo * 1e5) / 1e5)
                .put(w.e?.let { Math.round(it) } ?: org.json.JSONObject.NULL).put(w.d).put(w.t ?: org.json.JSONObject.NULL))
            x.put("w", a) }
        fun e(v: String) = URLEncoder.encode(v, "UTF-8").replace("+", "%20")
        return "https://losdelasclaras.github.io/rutas/?g=" + System.currentTimeMillis() + "#t3=" + e(Poli.polilinea3(s)) + "!" + e(t.nombre.take(80)) + "!" + e(x.toString())
    }

    private fun simplificar(p: List<DoubleArray>, tol: Double) = Poli.simplificar(p, tol)
    private fun polilinea(p: List<DoubleArray>) = Poli.polilinea(p)
}

object Poli {
    /** Douglas-Peucker en metros (igual que la web), para que el enlace sea corto. */
    fun simplificar(p: List<DoubleArray>, tol: Double): List<DoubleArray> {
        if (p.size < 3) return p
        val c = cos(Math.toRadians(p[0][0]))
        fun x(q: DoubleArray) = q[1] * 111320 * c
        fun y(q: DoubleArray) = q[0] * 110540
        val keep = BooleanArray(p.size); keep[0] = true; keep[p.size - 1] = true
        val pila = ArrayDeque<IntArray>(); pila.add(intArrayOf(0, p.size - 1))
        while (pila.isNotEmpty()) {
            val (a, b) = pila.removeLast().let { it[0] to it[1] }
            val ax = x(p[a]); val ay = y(p[a]); val bx = x(p[b]); val by = y(p[b]); val dx = bx - ax; val dy = by - ay
            val l = hypot(dx, dy).let { if (it == 0.0) 1.0 else it }
            var mx = 0.0; var ix = -1
            for (i in a + 1 until b) { val d = abs(dy * x(p[i]) - dx * y(p[i]) + bx * ay - by * ax) / l; if (d > mx) { mx = d; ix = i } }
            if (mx > tol && ix > 0) { keep[ix] = true; pila.add(intArrayOf(a, ix)); pila.add(intArrayOf(ix, b)) }
        }
        return p.filterIndexed { i, _ -> keep[i] }
    }

    /** 8 nov 2026: igual, con la altura en metros como tercer valor (0 si no hay). La web la lee con dec3. */
    fun polilinea3(p: List<DoubleArray>): String {
        val sb = StringBuilder(); var pl = 0; var pn = 0; var pa = 0
        fun enc(v0: Int) { var v = if (v0 < 0) (v0 shl 1).inv() else v0 shl 1
            while (v >= 0x20) { sb.append(((0x20 or (v and 0x1f)) + 63).toChar()); v = v shr 5 }
            sb.append((v + 63).toChar()) }
        for (q in p) { val la = (q[0] * 1e5).roundToInt(); val lo = (q[1] * 1e5).roundToInt(); val al = if (q.size > 2 && !q[2].isNaN()) q[2].roundToInt() else 0
            enc(la - pl); enc(lo - pn); enc(al - pa); pl = la; pn = lo; pa = al }
        return sb.toString()
    }

    /** Polilínea codificada de Google (5 decimales). */
    fun polilinea(p: List<DoubleArray>): String {
        val sb = StringBuilder(); var pl = 0; var pn = 0
        fun enc(v0: Int) { var v = if (v0 < 0) (v0 shl 1).inv() else v0 shl 1
            while (v >= 0x20) { sb.append(((0x20 or (v and 0x1f)) + 63).toChar()); v = v shr 5 }
            sb.append((v + 63).toChar()) }
        for (q in p) { val la = (q[0] * 1e5).roundToInt(); val lo = (q[1] * 1e5).roundToInt(); enc(la - pl); enc(lo - pn); pl = la; pn = lo }
        return sb.toString()
    }
}
