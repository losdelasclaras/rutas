package es.losdelasclaras.rutas

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast

/**
 * Lo primero al tocar el icono. Si la app no tiene permiso de ubicación, lo pide (la ventana de Android de siempre)
 * y después abre la web. Sin ese permiso, dentro de la app «Yo» se queda buscando y nunca encuentra nada.
 * Si se dice que no, no se vuelve a preguntar en cada arranque (solo otra vez pasados 7 días).
 */
class PermisoActivity : Activity() {
    private val perms = arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
    private fun tiene() = Build.VERSION.SDK_INT < 23 || perms.any { checkSelfPermission(it) == PackageManager.PERMISSION_GRANTED }

    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        val pref = getSharedPreferences("ldc", MODE_PRIVATE)
        val ultima = pref.getLong("permiso_pedido", 0L)
        if (tiene() || System.currentTimeMillis() - ultima < 7L * 24 * 3600 * 1000) { abrir(); return }
        pref.edit().putLong("permiso_pedido", System.currentTimeMillis()).apply()
        requestPermissions(perms, 7)
    }

    override fun onRequestPermissionsResult(code: Int, p: Array<out String>, r: IntArray) {
        super.onRequestPermissionsResult(code, p, r)
        if (!tiene()) Toast.makeText(this, "Sin permiso de ubicación, «Yo» no podrá encontrarte. Puedes darlo en Ajustes › Aplicaciones › Los de las Claras › Permisos.", Toast.LENGTH_LONG).show()
        abrir()
    }

    private fun abrir() {
        val i = Intent(this, WebActivity::class.java)
        intent?.data?.let { i.data = it }
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        startActivity(i)
        overridePendingTransition(0, 0)
        finish()
    }
}
