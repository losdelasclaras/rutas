package es.losdelasclaras.rutas

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import com.google.androidbrowserhelper.trusted.LauncherActivity

/**
 * Arranque de la app: la web a pantalla completa (Trusted Web Activity), como las apps hechas con Bubblewrap.
 * - La primera vez pide el permiso de ubicación (sin él, «Yo» no encuentra nada) y después abre la web.
 * - Vigía: si a los 10 s Chrome no ha abierto la web, se cierra y avisa en vez de quedarse la pantalla negra.
 */
class WebActivity : LauncherActivity() {
    private val h = Handler(Looper.getMainLooper())
    private var tapada = false
    private val perms = arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
    private fun tiene() = Build.VERSION.SDK_INT < 23 || perms.any { checkSelfPermission(it) == PackageManager.PERMISSION_GRANTED }
    private fun pedir(): Boolean {
        if (tiene()) return false
        val p = getSharedPreferences("ldc", MODE_PRIVATE)
        return System.currentTimeMillis() - p.getLong("permiso_pedido", 0L) > 7L * 24 * 3600 * 1000
    }
    private var preguntando = false

    /** Si se está grabando un recorrido, al abrir la app desde el icono se va directo a la pantalla de grabar
     *  (salvo justo después de tocar 🏠 en esa pantalla, que es para ir a la app). */
    private var aGrabar = false
    private fun grabando(): Boolean {
        val g = Grab.prefs(this)
        if (!g.getBoolean("activo", false)) return false
        val v = g.getLong("volver_t", 0L)
        if (System.currentTimeMillis() - v < 20000) { g.edit().remove("volver_t").apply(); return false }
        return true
    }
    override fun shouldLaunchImmediately(): Boolean {
        if (intent?.data == null && grabando()) { aGrabar = true; return false }
        preguntando = pedir(); return !preguntando }

    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        if (aGrabar) {
            startActivity(Intent(this, GrabarActivity::class.java).putExtra("desdeIcono", true).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            finish(); return
        }
        if (preguntando && !isFinishing) {
            getSharedPreferences("ldc", MODE_PRIVATE).edit().putLong("permiso_pedido", System.currentTimeMillis()).apply()
            requestPermissions(perms, 7)
        }
    }
    override fun onRequestPermissionsResult(code: Int, p: Array<out String>, r: IntArray) {
        super.onRequestPermissionsResult(code, p, r)
        if (!tiene()) Toast.makeText(this, "Sin permiso de ubicación, «Yo» no podrá encontrarte. Puedes darlo en Ajustes › Aplicaciones › Los de las Claras › Permisos.", Toast.LENGTH_LONG).show()
        preguntando = false; tapada = false; vigilar(); launchTwa()
    }

    private val vigia = Runnable {
        if (tapada || isFinishing || preguntando) return@Runnable
        Toast.makeText(this, "No se ha podido abrir. Vuelve a tocar el icono de la app.", Toast.LENGTH_LONG).show()
        finishAndRemoveTask()
    }
    private fun vigilar() { h.removeCallbacks(vigia); h.postDelayed(vigia, 10000) }
    override fun onResume() { super.onResume(); if (!tapada && !preguntando && !aGrabar) vigilar() }
    override fun onPause() { super.onPause(); if (!preguntando) tapada = true; h.removeCallbacks(vigia) }
    /** 9 nov 2026: si la web se ha cerrado (gesto «Atrás» al principio) y se vuelve aquí, se cierra la app del todo y se quita
     *  de recientes. Antes (LauncherActivity solo hacía finish) quedaba una tarjeta en recientes que al tocarla se quedaba
     *  en blanco o negro. La próxima vez arranca limpia desde el icono. */
    override fun onRestart() { if (tapada && !preguntando && !aGrabar) finishAndRemoveTask(); super.onRestart() }
    override fun onDestroy() { h.removeCallbacks(vigia); super.onDestroy() }
}
