package es.losdelasclaras.rutas

import android.os.Handler
import android.os.Looper
import android.widget.Toast
import com.google.androidbrowserhelper.trusted.LauncherActivity

/**
 * La web a pantalla completa (Trusted Web Activity).
 * Vigía: a veces Chrome no llega a abrir la web y se queda la pantalla negra con la barra roja.
 * Si a los 10 s la web no ha tapado esta pantalla, se vuelve a lanzar una vez; si tampoco, se cierra y avisa.
 */
class WebActivity : LauncherActivity() {
    private val h = Handler(Looper.getMainLooper())
    private var tapada = false
    private val vigia = Runnable {
        if (tapada || isFinishing) return@Runnable
        val p = getSharedPreferences("ldc", MODE_PRIVATE)
        if (System.currentTimeMillis() - p.getLong("reintento", 0L) > 60000) {
            p.edit().putLong("reintento", System.currentTimeMillis()).apply()
            Toast.makeText(this, "Abriendo la app…", Toast.LENGTH_SHORT).show()
            startActivity(intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK))
            finish()
        } else {
            Toast.makeText(this, "No se ha podido abrir. Cierra Chrome (Ajustes › Aplicaciones › Chrome › Forzar detención) y vuelve a abrir la app.", Toast.LENGTH_LONG).show()
            finishAndRemoveTask()
        }
    }
    override fun onResume() { super.onResume(); if (!tapada) { h.removeCallbacks(vigia); h.postDelayed(vigia, 10000) } }
    override fun onPause() { super.onPause(); tapada = true; h.removeCallbacks(vigia) }
    override fun onDestroy() { h.removeCallbacks(vigia); super.onDestroy() }
}
