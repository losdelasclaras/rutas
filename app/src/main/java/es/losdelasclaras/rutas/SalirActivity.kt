package es.losdelasclaras.rutas

import android.app.Activity
import android.content.Intent
import android.os.Bundle

/**
 * 9 nov 2026: «Salir» desde la app (gesto «Atrás» en el mapa → barra «¿Salir de la app? [Salir]»).
 * La web abre ldcrutas://salir y aquí se va al escritorio, igual que deslizar hacia arriba: la app se queda en segundo plano
 * (no se cierra), así al volver aparece al momento. Cerrarla del todo con «Atrás» hacía que Chrome se colgara al reabrirla.
 * No se ve: tema NoDisplay y se termina en onCreate.
 */
class SalirActivity : Activity() {
    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        try { startActivity(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (e: Exception) {}
        finish()
    }
}
