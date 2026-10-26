# Fuente de la app (rama «fuente»)
Copia de trabajo para regenerar la app. La app publicada está en la rama main.
- app/parse.py <kml> → points.json · app/build.py → data.json · app/assemble.py → final_data.json + rutas.html
- app/gpx/raw/*.gpx → app/gpx/proc.py → gpx/tracks.json (luego assemble.py)
- pwa/build_pwa.py → genera la web en /home/claude/pwa/site (rama main); fotos: copiar de la rama main (fotos/)
- Decisiones a mano: dificultad_manual.json, dif_manual2.json, dif_listados_2025.json, regiones.json, concejos.json, etiquetas.json
