package es.losdelasclaras.rutas

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Toast

/**
 * Dentro de la app, Chrome no le da la ubicación a la web. La web abre esto (intent://ubicar?p=…), que la pide a Android
 * (como la pantalla de grabar, que siempre funciona) y vuelve a la web con …/rutas/#yo=lat,lon,precisión,hora,para.
 */
class UbicarActivity : Activity(), LocationListener {
    private val h = Handler(Looper.getMainLooper())
    private var lm: LocationManager? = null
    private var mejor: Location? = null
    private var hecho = false
    private val para by lazy { (intent?.data?.getQueryParameter("p") ?: "yo").replace(Regex("[^a-z]"), "").take(12) }

    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        if (!permiso()) { requestPermissions(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION), 3); return }
        buscar()
    }
    private fun permiso() = checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
        checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
    override fun onRequestPermissionsResult(rc: Int, p: Array<out String>, r: IntArray) {
        super.onRequestPermissionsResult(rc, p, r)
        if (permiso()) buscar() else { Toast.makeText(this, "Sin permiso de ubicación: Ajustes › Aplicaciones › Los de las Claras › Permisos", Toast.LENGTH_LONG).show(); volver(null) }
    }

    @SuppressLint("MissingPermission")
    private fun buscar() {
        val m = getSystemService(LOCATION_SERVICE) as LocationManager; lm = m
        // lo último que sepa el móvil, si es reciente, vale al momento
        for (pr in listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)) try {
            val l = m.getLastKnownLocation(pr); if (l != null && (mejor == null || l.time > mejor!!.time)) mejor = l } catch (e: Exception) {}
        val l0 = mejor
        if (l0 != null && System.currentTimeMillis() - l0.time < 120000 && (!l0.hasAccuracy() || l0.accuracy < 200)) { volver(l0); return }
        Toast.makeText(this, "Buscando dónde estás…", Toast.LENGTH_SHORT).show()
        try { m.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 0L, 0f, this, Looper.getMainLooper()) } catch (e: Exception) {}
        try { m.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0L, 0f, this, Looper.getMainLooper()) } catch (e: Exception) {}
        // a los 4 s vale la aproximada (red); a los 15 s, lo mejor que haya
        h.postDelayed({ val b = mejor; if (b != null && System.currentTimeMillis() - b.time < 120000) volver(b) }, 4000)
        h.postDelayed({ volver(mejor?.takeIf { System.currentTimeMillis() - it.time < 30 * 60000 }) }, 15000)
    }
    override fun onLocationChanged(l: Location) {
        val b = mejor
        if (b == null || l.time > b.time + 60000 || (l.hasAccuracy() && (!b.hasAccuracy() || l.accuracy < b.accuracy))) mejor = l
        // con una buena (GPS o menos de 60 m) ya está
        if (l.provider == LocationManager.GPS_PROVIDER || (l.hasAccuracy() && l.accuracy < 60)) volver(l)
    }
    @Deprecated("") override fun onStatusChanged(p: String?, s: Int, e: Bundle?) {}
    override fun onProviderEnabled(p: String) {}
    override fun onProviderDisabled(p: String) {}

    private fun volver(l: Location?) {
        if (hecho) return; hecho = true
        h.removeCallbacksAndMessages(null); try { lm?.removeUpdates(this) } catch (e: Exception) {}
        val frag = if (l == null) "#yonada=$para" else
            "#yo=" + "%.6f".format(java.util.Locale.US, l.latitude) + "," + "%.6f".format(java.util.Locale.US, l.longitude) + "," +
            Math.round(if (l.hasAccuracy()) l.accuracy else 50f) + "," + System.currentTimeMillis() + "," + para
        if (l == null) Toast.makeText(this, "No he podido saber dónde estás (¿ubicación del móvil apagada?)", Toast.LENGTH_LONG).show()
        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://losdelasclaras.github.io/rutas/" + frag)).setClass(this, WebActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK))
        overridePendingTransition(0, 0)
        finish()
    }
    override fun onDestroy() { h.removeCallbacksAndMessages(null); try { lm?.removeUpdates(this) } catch (e: Exception) {}; super.onDestroy() }
}
