# Modelos GLB de equipos en la escena Babylon del búnker (Fase 13)

## Qué hace

La vista 3D Babylon de Inspección 3D (`BabylonRuntimeSmokePreview`, bandera `VISOR_3D_BABYLON`, **activa por
omisión desde el 23-11-2026**; se apaga con `VITE_VISOR_3D_BABYLON=false`) dibuja cada equipo de la escena (`MedicalScene.equipment`,
una entrada por fuente del plano) con una caja de huella y un toro de gantry. Ahora, si hay ruta configurada,
intenta además cargar el GLB a escala real que corresponde al equipo:

| Perfil / texto del equipo | Modalidad por omisión | GLB | Isocentro sobre piso |
|---|---|---|---|
| Versa HD, Agility (`PERFIL_ELEKTA_VERSA_HD`) | `linac` | `elekta_versa_hd_web.glb` (6.9 MB, 384k tri) | 1.240 m |
| Gamma Knife, Leksell, Perfexion, Esprit, Icon | `gammaKnife` | `elekta_leksell_gamma_knife_web.glb` | 0.967 m (estimado) |
| Biograph, Trinion | `petct` | `siemens_biograph_trinion_web.glb` | 1.064 m |
| Elekta Studio, Flexitron, braquiterapia | `hdr` | `elekta_studio_braquiterapia_web.glb` | 1.117 m |

La elección (`modeloGlbParaEquipo` en `src/lib/medical3D/modelosEquipoGlb.ts`) busca primero el nombre del
equipo; si no lo encuentra usa la modalidad, salvo que el texto nombre otro fabricante (TrueBeam, GE, Varian…),
para no dibujar un Versa HD en lugar de otro acelerador. CT y radiofarmacia no tienen modelo.

## Colocación

Los GLB están en metros, +Y arriba y con el origen en el isocentro. El origen se pone en
`(x del equipo, altura del isocentro, z del equipo)`: la posición de la fuente en el plano es el isocentro
del búnker y el piso de la escena está en y = 0. Verificado con `NullEngine` de Babylon: el punto más bajo
de los cuatro modelos queda en y = 0.000 ± 0.001 m.

Babylon convierte glTF (mano derecha) a su sistema de mano izquierda con el nodo `__root__`, así que el eje X del
modelo aparece invertido respecto del glTF; la orientación se ajusta con la guiñada configurable:

- `VITE_EQUIPO_GLB_ORIENTACION_DEG` (grados, por omisión 0) fija el valor inicial.
- En la vista, el selector «Orientación» (0/90/180/270°) gira el modelo sin recargar la escena.
- El interruptor «Equipo GLB a escala real» muestra el GLB u oculta y vuelve a la caja + toro.

## Respaldo

Si `VITE_EQUIPO_GLB_BASE` está vacía (por omisión), no se pide ningún archivo. Si el archivo no existe o
falla la carga, se queda la representación esquemática y la vista lo indica («n/m cargados»). Nada de
esto cambia el cálculo de blindaje, el floorplan ni el paquete de evidencia.

## Dónde van los GLB (decisión)

**No van en `public/` ni en este repositorio.** Los modelos están licenciados al propietario para uso
privado; RadShieldMx es un repositorio **público** y `public/` se publica tal cual en Pages/Netlify/Vercel.
Además, 15 MB de GLB (sólo versiones web) inflarían cada despliegue. Por eso:

- La fuente es el repo privado `plaeyade/3D-Models` (`modelos/<equipo>/glb/<clave>_web.glb`).
- La app los pide a `VITE_EQUIPO_GLB_BASE` (URL o ruta relativa, con o sin `/` final).
- **CSP:** `index.html` declara `connect-src 'self'`, así que la base debe ser del **mismo origen** que la app
  (p. ej. `/modelos-equipo/`, servida por el mismo servidor o un proxy inverso). Una URL de otro origen
  (`http://otro-host/…`) la bloquea el navegador y la vista se queda con la representación esquemática;
  para usarla habría que añadir ese origen a `connect-src` (decisión de seguridad, no se hace por omisión).
  Verificado el 23-11-2026 al tomar las capturas con el GLB del Versa HD.
- `.gitignore` ignora `public/modelos-equipo/` y `*.glb` para que no se versionen por accidente.

Uso local (desarrollo o build de escritorio que no se publica):

```powershell
# Desde la raíz de RadShieldMx, con 3D-Models clonado al lado
New-Item -ItemType Directory -Force public\modelos-equipo | Out-Null
Copy-Item ..\3D-Models\modelos\*\glb\*_web.glb public\modelos-equipo\
# .env.local (no versionado)
#   (VITE_VISOR_3D_BABYLON ya no hace falta: la vista Babylon está activa por omisión)
#   VITE_EQUIPO_GLB_BASE=/modelos-equipo/
npm run dev
```

No ejecutes `vite build` para desplegar con `public/modelos-equipo/` lleno: Vite copiaría los GLB a `dist/`.
