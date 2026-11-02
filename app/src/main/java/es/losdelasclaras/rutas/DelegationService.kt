package es.losdelasclaras.rutas

import com.google.androidbrowserhelper.locationdelegation.LocationDelegationExtraCommandHandler

/** Pasa la ubicación de Android a la web cuando se abre desde el icono (Chrome se la pide a la app). */
class DelegationService : com.google.androidbrowserhelper.trusted.DelegationService() {
    init { registerExtraCommandHandler(LocationDelegationExtraCommandHandler()) }
}
