package es.losdelasclaras.rutas

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import com.google.androidbrowserhelper.trusted.LauncherActivity
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
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).setClass(this, LauncherActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        }
        finish()
    }

    private class Track(val nombre: String, val pts: List<DoubleArray>)

    /** Lee trkpt / rtept (GPX) o coordinates de LineString (KML). Si hay varios tramos, los junta. */
    private fun leer(input: java.io.InputStream): Track {
        val p = XmlPullParserFactory.newInstance().apply { isNamespaceAware = false }.newPullParser()
        p.setInput(input, null)
        val pts = ArrayList<DoubleArray>(); val rte = ArrayList<DoubleArray>()
        var nombre = ""; var enTrk = false; var enLinea = false; var dentroCoord = false
        var ev = p.eventType
        while (ev != XmlPullParser.END_DOCUMENT) {
            val tag = p.name?.substringAfter(':')?.lowercase()
            if (ev == XmlPullParser.START_TAG) {
                when (tag) {
                    "trk", "rte" -> enTrk = true
                    "trkpt", "rtept" -> {
                        val la = p.getAttributeValue(null, "lat")?.toDoubleOrNull(); val lo = p.getAttributeValue(null, "lon")?.toDoubleOrNull()
                        if (la != null && lo != null) (if (tag == "trkpt") pts else rte).add(doubleArrayOf(la, lo))
                    }
                    "linestring" -> enLinea = true
                    "coordinates" -> dentroCoord = enLinea
                    "name" -> if (nombre.isEmpty() || enTrk) { val t = p.nextText().trim(); if (t.isNotEmpty() && (nombre.isEmpty() || enTrk && pts.isEmpty())) nombre = t }
                }
            } else if (ev == XmlPullParser.END_TAG) {
                when (tag) { "trk", "rte" -> enTrk = false; "linestring" -> enLinea = false; "coordinates" -> dentroCoord = false }
            } else if (ev == XmlPullParser.TEXT && dentroCoord) {
                for (c in p.text.trim().split(Regex("\\s+"))) {
                    val v = c.split(","); if (v.size >= 2) { val lo = v[0].toDoubleOrNull(); val la = v[1].toDoubleOrNull(); if (la != null && lo != null) pts.add(doubleArrayOf(la, lo)) }
                }
            }
            ev = p.next()
        }
        return Track(nombre.ifEmpty { "Track" }, if (pts.size >= 2) pts else rte)
    }

    private fun enlace(t: Track): String? {
        if (t.pts.size < 2) return null
        val s = simplificar(t.pts, 6.0)
        return "https://losdelasclaras.github.io/rutas/#t=" + URLEncoder.encode(polilinea(s), "UTF-8") + "!" + URLEncoder.encode(t.nombre.take(80), "UTF-8").replace("+", "%20")
    }

    /** Douglas-Peucker en metros (igual que la web), para que el enlace sea corto. */
    private fun simplificar(p: List<DoubleArray>, tol: Double): List<DoubleArray> {
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

    /** Polilínea codificada de Google (5 decimales). */
    private fun polilinea(p: List<DoubleArray>): String {
        val sb = StringBuilder(); var pl = 0; var pn = 0
        fun enc(v0: Int) { var v = if (v0 < 0) (v0 shl 1).inv() else v0 shl 1
            while (v >= 0x20) { sb.append(((0x20 or (v and 0x1f)) + 63).toChar()); v = v shr 5 }
            sb.append((v + 63).toChar()) }
        for (q in p) { val la = (q[0] * 1e5).roundToInt(); val lo = (q[1] * 1e5).roundToInt(); enc(la - pl); enc(lo - pn); pl = la; pn = lo }
        return sb.toString()
    }
}
