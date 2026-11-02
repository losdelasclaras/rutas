package es.losdelasclaras.rutas

import android.Manifest
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

    override fun shouldLaunchImmediately(): Boolean { preguntando = pedir(); return !preguntando }

    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
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
    override fun onResume() { super.onResume(); if (!tapada && !preguntando) vigilar() }
    override fun onPause() { super.onPause(); if (!preguntando) tapada = true; h.removeCallbacks(vigia) }
    override fun onDestroy() { h.removeCallbacks(vigia); super.onDestroy() }
}
