package es.losdelasclaras.rutas

import android.os.Handler
import android.os.Looper
import android.widget.Toast
import com.google.androidbrowserhelper.trusted.LauncherActivity

/**
 * Arranque de la app (abre la web a pantalla completa).
 * Es transparente: si por lo que sea la web no llega a abrirse, en vez de quedarse
 * «colgada» encima de todo (pantalla que no responde), se cierra sola a los 12 s y avisa.
 */
class InicioActivity : LauncherActivity() {
    private val h = Handler(Looper.getMainLooper())
    private var tapada = false
    private val vigia = Runnable {
        if (!tapada && !isFinishing) {
            Toast.makeText(this, "No se ha podido abrir. Vuelve a pulsar el icono de la app.", Toast.LENGTH_LONG).show()
            finishAndRemoveTask()
        }
    }
    override fun onResume() { super.onResume(); if (!tapada) { h.removeCallbacks(vigia); h.postDelayed(vigia, 12000) } }
    override fun onPause() { super.onPause(); tapada = true; h.removeCallbacks(vigia) }
    override fun onDestroy() { h.removeCallbacks(vigia); super.onDestroy() }
}
