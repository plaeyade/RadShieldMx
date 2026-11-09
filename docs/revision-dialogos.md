# Revisión a fondo de diálogos (Fases 7, 8 y 8c)

Fecha: 2026-11-09 · Ramas `fase7` y `fase8` · Alcance: los 202 archivos de `src/sections/dialogs/`. Sustituye a la revisión
automática de la Fase 6: no quedan filas «no revisado a fondo».

## Método

1. **Código, diálogo por diálogo.** Para cada archivo se leyó el bloque de cálculo (líneas con aritmética o con
   llamadas a `@/lib`, `@/hooks` y `@/data`) y se rastreó de dónde salen los datos (plano del proyecto, entrada del
   usuario, tabla fija, backend o datos de demostración) y qué función calcula. Cuando el cálculo vive en una
   biblioteca (`useFloorCeilingCalc`, `useNeutronCalc`, `lib/skyshine`, `lib/spect`, `lib/therapy`, `lib/agents`,
   `lib/ml`, `lib/validation`, `uaqProtocol`, `bimRAD`, `shieldingOptimizer`, `mcginleyData`, `cbctIGRTData`,
   `useCostOptimizer`) también se leyó.
2. **Unidades y fórmulas** contra NCRP 147 (Ec. 4.3/4.4/4.8, Tablas 4.5, 4.7, B.1, C.1), NCRP 151 (Ec. 2.1, 2.3,
   2.7, 2.8, 5.1; Tablas B.2, B.4, B.5a, B.7; §1.4.3, §2.2, §2.4) y AAPM TG-108 (Ec. 2–3, 9–10; Tablas IV y V), con
   los PDF de `data/pdf/`. ICRP 74/ICRU 57 e IAEA SSR-6 no están en `data/pdf/`: esas filas se marcan «verificar».
3. **Navegador.** Playwright con Chrome sobre `vite` (desarrollo) y el plano DXF de la Fase 4 con una fuente de
   radiografía: (a) en la app, cada uno de los 174 diálogos montados con `LazyDialog` se abre con
   `useAppStore.open()`; (b) los 31 que la app abre por estado local o props se montan aislados con un arnés
   temporal. En ambos casos se pulsa el primer botón de cálculo («Calcular», «Ejecutar», «Generar», «Run»…), se
   registran errores y avisos de consola y se busca `NaN`/`undefined` en el texto. Resultado: 202/202 abren (o, en 4
   casos, necesitan las props que la app sí les pasa); sólo quedan avisos de consola de three.js en los visores 3D.
4. Corregido en este PR, además de la Fase 7: la clave React duplicada de `BatemanDecayDialog` («Rb-82»), único
   error de consola reproducible en la app.

## Resumen

| | Cantidad |
|---|---|
| Diálogos revisados | 202 |
| Estado OK / riesgo / error | 111 / 90 / 1 |
| Prioridad alta / media / baja / sin acción | 0 / 0 / 109 / 93 |
| Calculadoras migradas al motor (Fase 7 + Fase 8a + MultiEnergySpectra) | 10 + 13 + 1 |
| Diálogos con datos falsos retirados (Fase 8b) | 4 (suite NCRP, reporte CNSNS, certificaciones, alertas) |
| Fase 8c + 8d: diálogos de prioridad media atendidos | 67 de 67 (8d: división de MedicalFloorPlan3D) |

### Hallazgos transversales (de la revisión de la Fase 7; los cuatro primeros se corrigieron en la Fase 8)

- **Unidades mSv/Gy (×1000).** `B = P·d²/(W·U·T)` con P en mSv/semana y W en Gy/semana sin el factor 10⁻³ en
  VersaHD15MV, ElectronApplicator, EquipmentShieldingWizard, `lib/agents/tools` (ShieldingDesignAgent),
  `lib/ml/trainingData` y `useAutoML` (MLPrediction) y CrossValidation; `useFloorCeilingCalc` comete el mismo error
  al revés. B queda 1000× grande: el espesor sale ≈ 3 TVL más delgado (no conservador). Ejemplo: VersaHD con sus
  valores iniciales da ≈ 84 cm de concreto frente a ≈ 205 cm con NCRP 151. `uaqProtocol.eq41` sí convierte bien.
- **TVL contra HVL.** `useNeutronCalc` multiplica el número de TVL por la HVL; varias tablas de texto dan la HVL
  como TVL (Ir-192 plomo «3 mm», Tc-99m «0.3 mm»); AAPMTG108PET usa 5.8 mm de plomo a 511 keV (TG-108: ≈ 16.5 mm).
- **Validación falsa.** `NCRPValidationSuite` define cada caso como `calc: () => expected` y el diálogo siempre
  informa «24/24, motor validado».
- **Datos fijos o inventados presentados como reales:** reporte CNSNS automático, certificaciones (CE, ISO),
  alertas regulatorias, bitácoras de auditoría, logs, tableros, comparadores de escenarios y pacientes de PACS.
- **Accesibilidad:** 29 diálogos de pantalla completa hechos con `div` propios no tienen rol `dialog` ni título
  accesible, y 157 `DialogContent` no tienen `DialogDescription`. **Idioma:** 73 diálogos con varios textos visibles en inglés.
- **Límites de dosis inconsistentes** entre diálogos (público 1 o 5 mSv/año; «controlada NCRP 147 = 20 μSv/semana»).

### Fase 8 (8a + 8b)

- **8a, unidades y fórmulas:** VersaHD15MV, ElectronApplicator, EquipmentShieldingWizard (`lib/blindajeEquipo`), el
  agente de diseño (`lib/agents/tools`), los datos de entrenamiento y el benchmark del ML, FloorCeiling, NeutronDialog
  (`useNeutronCalc`), AAPMTG108PET, NuclearDoseGrid (`lib/mallaNuclear`), CrossValidation y TornadoSensitivity pasan a
  `calculadorasNormativas`/`ncrp151Laberinto`/`tg108`, cada uno con prueba contra un ejemplo publicado
  (`src/__tests__/validacion/fase8.test.tsx`).
- **8b, datos falsos:** la suite NCRP calcula con el motor real (17 casos publicados; falla si no los reproduce); el
  reporte CNSNS sale del proyecto o muestra estado vacío; se retiraron las certificaciones CE/FDA/ISO y las alertas
  regulatorias inventadas.
- **«Failed to fetch» de DoseMapping3D:** `<Text>` de drei (troika-three-text) descarga la fuente de un CDN y fallaba sin
  red; DoseMapping3D y Viewer3D usan ahora `<Html>`. En Chrome los 16 diálogos tocados abren, calculan y dejan la
  consola sin errores (sólo avisos de three.js).
- MultiEnergySpectra (último de prioridad alta): el espectro entra por los ajustes de Archer de NCRP 147 (Tablas B.1/C.1)
  y, en TC, por el método DLP (§5.6.1, `blindajeTC`); reproduce §5.3.3.1, §5.3.1.1 y §5.6.1
  (`src/__tests__/validacion/multiEnergySpectra.test.tsx`). No queda ningún diálogo de prioridad alta.

### Fase 8c (prioridad media, por tema)

Pruebas en `src/__tests__/validacion/fase8c.test.tsx` (21 casos).

- **Modelos locales → NCRP 151.** Skyshine con la Ec. 5.1 (`skyshineFotones`; reproduce la columna calculada de la
  Tabla 5.1 a ±8 %) en ChiltonSkyshine y ModelingToolbox; incidencia oblicua con la corrección de §2.2
  (`incidenciaOblicua`); Co-60 con TVL₁/TVLₑ de la Tabla B.2 (`blindajeCo60`, componente `CalculadoraCo60`) en Gamma Knife
  (fórmula con el cociente invertido corregida) y braquiterapia Co-60 (entradas editables); EquipmentManager con
  `barreraMV`; el optimizador genético (`lib/shieldingOptimizer`) con `barreraMV` y equivalencia de densidad rotulada
  (reproduce 149.6 cm del §7.1.1); NeutronMaze, NeutronShielding y SecondaryBarrierAlbedo redirigen a las calculadoras
  validadas (`maze`, `neutron`).
- **Modelos locales → NCRP 147 / TG-108.** Secundaria de diagnóstico (antes «St-Germain») con K¹_sec y Archer C.1
  (§5.3.1.2: 0.47 mGy/semana, 33 mm); CBCT como TC de cuerpo por DLP (`blindajeTC`); emisores β+ de
  NuclearMedicineAdvanced y BIMRAD con la Tabla V de TG-108; comparador común de materiales (`ComparadorMateriales`) en
  Pareto, CostOptimizer, PredictiveMaterial, AlaraWizard y MaterialComparison (la tabla XCOM queda rotulada); barrera
  laminada = multicapa de la Fase 7; IPEM 109 con TVL continuo, la sala por la suma y TVL (no HVL) de Tc-99m;
  terapia con radiofármacos compara la sala con la meta una vez.
- **Unidades y estados.** MCNPCyclotron (Q = Y·I, 1/(4πr²), μSv coherentes, estado de cumplimiento ya no invertido);
  AnnualDoseReport (T una vez, límite seleccionable); DashboardCalc (cumple sólo si instalado ≥ requerido, con
  `verificarPlano`); SourceLibrary (A·Γ/d² con Γ verificadas, Co-60 0.306 μGy·m²/(MBq·h)).
- **Textos normativos.** EPA (0.02 mSv/semana es el objetivo no controlado), transporte IAEA SSR-6 (IT y tasas a 1 m),
  Manual §3.1 (motor real), tabla única de límites `lib/limitesDosis` (ICRP 103; RGSR 1988 como histórico) en el
  checklist CNSNS, TVL de las bibliotecas de equipos y del asistente de memoria; avisos en ICRU 57 (coeficientes sin
  verificar), Buildup (tabla sin referencia), activación de concreto y DCHAIN.
- **Datos de demostración.** `DatosEjemploBanner` en auditoría, bitácora, logs, tableros, comparadores, rendimiento,
  resultados MC, reconstrucción de contornos, MC propios, detector multifuente, mapas animados y envío CNSNS; pacientes
  anonimizados en PACS y búsqueda DICOM; sin dosis fija en RTSTRUCT.
- **Navegación y acciones.** ParametricBunker genera el plano (`lib/bunkerParametrico`); AutoFillEquipment aplica el
  equipo a la fuente seleccionada (`lib/equipoAFuente`); CategoryTools enruta diagnóstico, PET, SPECT y radiofármacos a
  sus calculadoras; MaterialLibrary y ReportManager en la barra lateral; Revit/IFC declara su escala (0.01 m/px);
  ShieldingDesignAgent ya estaba en la barra de herramientas.
- Los diálogos sólo rotulados bajan a prioridad baja: falta conectarlos a datos reales.

### Fase 8d (último ítem de prioridad media)

- `MedicalFloorPlan3DDialog` (3 122 líneas) queda en 66 líneas que componen `src/sections/dialogs/medical3d/`: estado y
  escena (`useMedical3DEstado`, `useImportacionCadBim`), contratos visuales (`useContratosMedical3D`), exportaciones
  (`useExportacionesMedical3D`), paneles de la barra lateral (`PanelFlujoVisual`, `PanelesIntegracion`, `PanelMotor3D`,
  `ControlesVisuales`, `PanelesInspeccion`), visor (`VisorMedical3D`) y escena R3F (`escena/`: materiales, elementos,
  capas, cámaras, `RoomScene`). Babylon sigue en `BabylonRuntimeSmokePreview` tras `VISOR_3D_BABYLON` (apagada).
- Sin cambio de comportamiento: `src/__tests__/dialogs/MedicalFloorPlan3DDialog.test.tsx` (15 casos: render, presets,
  modo dosis y componentes, ayudas, interruptores, estaciones F147, captura, base PBR, 12 exportaciones e instantáneas
  del texto, del JSON de revisión, del OBJ y del tour) se escribió antes de dividir y pasa igual después.
- Los dos `setState` dentro de efectos (mouse-look al salir del recorrido, estado del embebido Unity) pasan a ajuste
  durante el render; los guardianes de contrato de `scripts/` leen el diálogo y sus módulos
  (`scripts/medical3d-dialog-source.mjs`).

## Tabla completa

Orden: prioridad y nombre. Esfuerzo: bajo ≤ 2 h, medio ≤ 1 día, alto > 1 día. «Navegador»: resultado de la prueba en Chrome.

| Diálogo | Función | Fuente de datos | Motor / cálculo | Estado | Hallazgo | Propuesta | Prioridad | Esfuerzo | Navegador |
|---|---|---|---|---|---|---|---|---|---|
| `AIAssistantDialog` | Asistente IA/RAG | backend tRPC (opcional) o respuestas locales | ninguno (informativo) | riesgo | Sin backend responde con plantillas locales; no calcula. Correcto como orientación. | Indicar en la cabecera cuándo está en modo sin conexión. | baja | bajo | abre (app); consola sin errores |
| `AdaptiveSamplingDialog` | Configuración de muestreo adaptativo | entrada del usuario | fórmula local (posiciones 0–1) | riesgo | Genera posiciones a lo largo de una barrera genérica; no se conecta con `generateSamplePoints` del motor ni con el plano. Textos en inglés. | Conectar con el muestreo del motor o retirar; traducir. | baja | medio | abre (app); consola sin errores |
| `AirKermaOverlay` | Curva de kerma a lo largo de la barrera | props (distribuciones calculadas) | ninguno (gráfica) | riesgo | Sólo dibuja lo que recibe; textos en inglés («Design Goal», «Position Along Barrier»). | Traducir. | baja | bajo | no se monta aislado (le faltan props/proveedores que la app sí pasa); consola sin errores |
| `AnimatedDoseMapsDialog` | Mapa de dosis animado (decaimiento) | parámetros internos | fórmula local (A·½^(t/T½)/d², unidades arbitrarias) | riesgo | Fase 8c: Rotulado con DatosEjemploBanner (datos de ejemplo). Sigue sin usar el plano. | Animar `mallaDosis` del plano. | baja | medio | abre (app); consola sin errores |
| `AnnualDoseReport` | Dosis anual acumulada por mes | entrada del usuario | fórmula local (T una vez) | OK | Fase 8c: T se aplica una sola vez; factores estacionales 1.0 por omisión; límite seleccionable (1 / 20 mSv/año). | Tomar el kerma semanal de un punto del plano. | baja | bajo | abre (app); consola sin errores |
| `AnomalyDetectionDialog` | Reglas de detección de anomalías | tabla fija en el diálogo | reglas locales | riesgo | Reglas fijas sobre entradas genéricas; textos en inglés. | Aplicar las reglas al plano y traducir. | baja | bajo | abre (app); calcula al pulsar «Run Anomaly Check»; consola sin errores |
| `Attila4MCVarianceReduction` | Reducción de varianza FW-CADIS (ilustrativa) | entrada del usuario | fórmula local | riesgo | Curvas ilustrativas; tiene aviso de resultado sintético. | Mantener aviso o retirar. | baja | bajo | abre (montado aislado); consola sin errores |
| `AuditDashboardDialog` | Línea de tiempo de auditoría | datos de demostración (AUDIT_DATA, 15 eventos) | ninguno (informativo) | riesgo | Fase 8c: Rotulado con DatosEjemploBanner (datos de ejemplo). | Leer de `auditTrail` (tRPC). | baja | bajo | abre (app); consola sin errores |
| `AuditLogDialog` | Bitácora para inspección | datos de demostración (DEMO_AUDIT, 12 eventos) | ninguno (informativo) | riesgo | Fase 8c: Rotulado con DatosEjemploBanner (datos de ejemplo). | Conectar a la bitácora real. | baja | bajo | abre (montado aislado); consola sin errores |
| `AuditTrailDialog` | Bitácora CNSNS | backend tRPC | ninguno (informativo) | OK | Lee la bitácora real; sin backend queda vacía. | Mensaje explícito cuando no hay backend. | baja | bajo | abre (app); consola sin errores |
| `AutoBarrierDetectionDialog` | Detección de barreras en imagen | imagen del usuario (usePlanAnalyzer) | visión por computadora local | riesgo | Heurística; textos en inglés. | Traducir; exigir revisión antes de aplicar. | baja | bajo | abre (app); consola sin errores |
| `AutoFillEquipmentDialog` | Autollenado desde base de equipos | tabla fija en el diálogo | lib/equipoAFuente | OK | Fase 8c: «Aplicar» carga modalidad, carga (fracciones/semana) e isocentro en la fuente seleccionada. | Traducir la lista de equipos. | baja | bajo | abre (app); consola sin errores |
| `BIMConnectorDialog` | Conector BIM (IFC) | archivo del usuario | ninguno (informativo) | riesgo | Guía e importación; textos en inglés. | Traducir. | baja | bajo | abre (app); consola sin errores |
| `BIMRADDialog` | Dosis sobre modelo BIM | archivo IFC del usuario | lib/bimRAD + transmisionPET (TG-108 Tabla V) | riesgo | Fase 8c: plomo/concreto atenúan con TG-108 Tabla V a 511 keV (antes TVL 5 mm Pb y 370 mm concreto); aviso de modelo ilustrativo. | Construir el plano desde el IFC y calcular con `mallaDosis`. | baja | alto | abre (app); consola sin errores |
| `BarrierEditor` | Editor de supuestos de la barrera | plano del proyecto (useCanvasStore/props) | ninguno (informativo) | riesgo | Edita U, T, P, material; textos en inglés. | Traducir. | baja | bajo | no se monta aislado (le faltan props/proveedores que la app sí pasa); consola sin errores |
| `BatchImportDialog` | Importación CSV/Excel | archivo del usuario | useBatchImport | OK | Importa barreras al plano. | Prueba de componente. | baja | bajo | abre (app); consola sin errores |
| `BatemanDecayDialog` | Solucionador de Bateman | lib/batemanSolver | lib/batemanSolver | riesgo | Error de consola por clave React duplicada (dos entradas «Rb-82») — *corregido aquí*; textos en inglés. | Desambiguar el símbolo de «Rb-82 (generador)» en la biblioteca; traducir. | baja | bajo | abre (app); calcula al pulsar «Solve»; consola sin errores |
| `BuildupFactorDialog` | Factor de acumulación multicapa | tabla local de buildup | fórmula local | riesgo | Fase 8c: aviso de tabla sin referencia y físicamente inconsistente; materiales sin datos ya no toman los del concreto. | Sustituir por ANS-6.4.3 (GP) citada o retirar. | baja | medio | abre (app); consola sin errores |
| `CADAssemblyMapper` | Asignación de materiales a ensamblajes CAD | archivo del usuario | reglas regex | riesgo | Patrones como /w/ y /al/ coinciden con «wall»; textos en inglés. | Anclar los patrones a palabras completas; traducir. | baja | bajo | abre (montado aislado); consola sin errores |
| `CADImportDialog` | Importar geometrías CAD | archivo del usuario | ninguno (informativo) | riesgo | Varios formatos marcados «future». | Ocultar los no disponibles. | baja | bajo | abre (app); consola sin errores |
| `CADToMCImport` | CAD → geometría Monte Carlo | archivo del usuario | generador de texto | riesgo | Genera cajas envolventes; textos en inglés; sin DialogTitle. | Traducir y añadir título. | baja | bajo | abre (montado aislado); consola sin errores |
| `CBCTIGRTDialog` | Blindaje adicional CBCT/IGRT | entrada del usuario | blindajeTC (NCRP 147 §5.6.1) + transmisionTC | OK | Fase 8c: CBCT como TC de cuerpo por DLP; dosis tras el concreto existente con Figs. A.2/A.3 (antes fórmula empírica sin K¹). | Tomar el DLP por estudio del fabricante. | baja | bajo | abre (app); calcula al pulsar «Calcular Dosis CBCT»; consola sin errores |
| `CNSNSChecklistDialog` | Checklist de dictamen CNSNS | tabla fija en el diálogo | lib/limitesDosis | OK | Fase 8c: límites de una tabla única citada (ICRP 103; RGSR 1988 como histórico) y objetivos NCRP/TG-108. | Confirmar la norma mexicana vigente. | baja | bajo | abre (app); consola sin errores |
| `CNSNSDigitalSubmission` | Envío digital CNSNS | datos de demostración | ninguno (informativo) | riesgo | Fase 8c: Rotulado con DatosEjemploBanner (datos de ejemplo). Rol dialog y título accesible; texto en español. | Prellenar desde el plano/memoria. | baja | medio | abre (app); consola sin errores |
| `ChiltonSkyshineDialog` | Skyshine | entrada del usuario | ncrp151.skyshineFotones (Ec. 5.1) | OK | Fase 8c: Ec. 5.1 de NCRP 151 con B_xs de la Tabla B.2; reproduce la columna calculada de la Tabla 5.1 (±8 %). Aviso de orden de magnitud. | Añadir neutrones (Ec. 5.2) con Fig. A.2. | baja | medio | abre (app); consola sin errores |
| `CollaborationHub` | Colaboración | estado local | ninguno (informativo) | riesgo | Comentarios locales; «Resolve» en inglés. | Traducir. | baja | bajo | abre (app); calcula al pulsar «Resolve»; consola sin errores |
| `CommunityTemplatesDialog` | Plantillas de la comunidad | tabla fija en el diálogo | ninguno (informativo) | riesgo | Descargas y calificaciones ficticias. | Quitar contadores o conectar a fuente real. | baja | bajo | abre (app); consola sin errores |
| `CompareModeDialog` | Comparar escenarios lado a lado | tabla fija en el diálogo | ninguno | riesgo | Fase 8c: Rotulado con DatosEjemploBanner (datos de ejemplo). | Comparar escenarios guardados del proyecto. | baja | medio | abre (app); consola sin errores |
| `CompareScenariosDialog` | Comparación de escenarios | tabla fija en el diálogo | ninguno | riesgo | Fase 8c: Rotulado con DatosEjemploBanner (datos de ejemplo). | Escenarios del proyecto. | baja | medio | abre (app); consola sin errores |
| `ConcreteActivationDialog` | Activación del concreto | entrada del usuario | fórmula local | riesgo | Fase 8c: aviso de resultado sintético (fórmula sin base dimensional). | Datos de activación medidos o transporte; o retirar. | baja | medio | abre (app); consola sin errores |
| `ControlPointsDialog` | Puntos de control y metas | props | ninguno (informativo) | riesgo | Editor; textos en inglés. | Traducir. | baja | bajo | abre (montado aislado); consola sin errores |
| `CostEstimatorDialog` | Estimador de costos | entrada del usuario | fórmula local | riesgo | Precios fijos editables; «Concreto 235 kg/cm²» mezcla resistencia y densidad. | Rotular resistencia vs densidad. | baja | bajo | abre (app); calcula al pulsar «Recalcular Costos»; consola sin errores |
| `CycloneKIUBEWizard` | Asistente de ciclotrón IBA KIUBE | lib/cycloneKIUBEData (documento del fabricante) | interpolación local | riesgo | Datos del fabricante interpolados; dosis anual con 4000 h fijas; sin DialogTitle. | Hacer editables las horas; título accesible. | baja | bajo | abre (app); consola sin errores |
| `DCHAINActivationCalculator` | Activación (estilo DCHAIN) | entrada del usuario | fórmula local | riesgo | Fase 8c: aviso de resultado ilustrativo; rol dialog y título. | Retirar o conectar a DCHAIN real. | baja | bajo | abre (montado aislado); calcula al pulsar «Calculate Activation»; consola sin errores |
| `DICOMRTIntegrationDialog` | Integración DICOM-RT | tabla fija en el diálogo | ninguno (informativo) | riesgo | Tabla de etiquetas fija; textos en inglés; no aplica nada al plano. | Traducir; conectar con el importador. | baja | medio | abre (app); consola sin errores |
| `DICOMRTSTRUCTDialog` | Importar RTSTRUCT | archivo del usuario | ninguno (informativo) | OK | Fase 8c: sin dosis ni plomo fijos; rol dialog y título en español. | Traducir el resto de textos. | baja | bajo | abre (app); consola sin errores |
| `DVHAnalyzer` | Analizador DVH | datos sintéticos | fórmula local | riesgo | DVH con ruido aleatorio; tiene aviso sintético. | Importar RTDOSE real. | baja | alto | abre (app); consola sin errores |
| `DarkModeDialog` | Apariencia | localStorage | ninguno (informativo) | riesgo | Duplica el conmutador de tema de la barra. | Unificar con `toggleDarkMode`. | baja | bajo | abre (app); consola sin errores |
| `DashboardDialog` | Tablero ejecutivo | tabla fija en el diálogo | ninguno (informativo) | riesgo | Fase 8c: Rotulado con DatosEjemploBanner (datos de ejemplo). | Derivar del plano. | baja | medio | abre (app); consola sin errores |
| `DecayChainsDialog` | Cadenas de decaimiento (generadores) | entrada del usuario | lib/decay/DecayChains | OK | Equilibrio transitorio estándar; sin DialogTitle. | Título accesible; prueba Mo-99/Tc-99m. | baja | bajo | abre (app); consola sin errores |
| `DecayHeatCalculator` | Calor de decaimiento | entrada del usuario | fórmula local | riesgo | Cálculo simple A·q; textos parcialmente en inglés. | Prueba de componente. | baja | bajo | abre (app); consola sin errores |
| `DesignCompareDialog` | Comparar versiones de diseño | tabla fija en el diálogo | ninguno | riesgo | Rotulado desde la Fase 6 (versiones fijas). | Conectar con el historial de versiones. | baja | medio | abre (app); consola sin errores |
| `DoseMapping3D` | Mapa 3D de dosis (visor en revisión) | plano del proyecto | doseMappingEngine/visoresDosis | riesgo | Fase 8: el «Failed to fetch» venía de <Text> de drei (troika descarga la fuente de un CDN); se sustituyó por <Html>. Sigue tras VISOR_DOSE3D=false. | Traducir y activar tras validación visual. | baja | bajo | abre (montado aislado); calcula al pulsar «Compute Mesh»; 1 aviso(s)/error(es) de consola |
| `DoseSweepDialog` | Barrido de dosis 360° | parámetros internos | ninguno (decorativo) | riesgo | Isodosis decorativas; tiene aviso (Fase 6). | Dibujar `mallaDosis` por ángulo o retirar. | baja | medio | abre (app); consola sin errores |
| `ElectronApplicatorDialog` | Blindaje del aplicador de electrones | entrada del usuario | barreraMV (fotones de contaminación) | OK | Fase 8a: P en Sv; W_x = W_e·f_x como primaria NCRP 151 a la energía tabulada ≥ E_e; pacientes por semana como entrada. | Citar la fuente de f_x por energía. | baja | bajo | abre (app); calcula al pulsar «Calcular Blindaje»; consola sin errores |
| `ElectronTransportDialog` | Transporte de electrones | entrada del usuario | lib/electronEngine | riesgo | Poderes de frenado propios sin prueba contra ESTAR; textos en inglés. | Prueba contra NIST ESTAR. | baja | medio | abre (app); calcula al pulsar «Ejecutar Transporte»; consola sin errores |
| `EmergencyProceduresDialog` | Procedimientos de emergencia | tabla fija en el diálogo | ninguno (informativo) | riesgo | Contactos de ejemplo (Ext. 5500). | Hacer configurables los contactos. | baja | bajo | abre (app); consola sin errores |
| `EquipmentManagerDialog` | Gestor de equipos | tabla fija en el diálogo | barreraMV (primaria NCRP 151) | OK | Fase 8c: calculadora rápida con TVL₁/TVLₑ de la Tabla B.2 (Co-60 para Gamma Knife); tabla de TVL desde ncrp151. | Traducir textos restantes. | baja | bajo | abre (app); consola sin errores |
| `EquipmentShieldingWizard` | Asistente de blindaje por equipo | entrada del usuario | lib/blindajeEquipo → barreraMV | OK | Fase 8a: primaria/fuga/dispersión NCRP 151, IMRT en la fuga, material por omisión válido; PET/SPECT/TC remiten a sus diálogos. | Añadir título accesible. | baja | bajo | abre (app); consola sin errores |
| `EvidencePackDialog` | Paquete de evidencia | plano del proyecto (useCanvasStore/props) | lib/evidencePack + f* | OK | Con pruebas; sin DialogTitle. | Título accesible. | baja | bajo | abre (montado aislado); consola sin errores |
| `ExampleWizardDialog` | Asistente de ejemplos | tabla fija en el diálogo | ninguno (informativo) | riesgo | «Público < 5 mSv/año (NOM-008)» choca con 1 mSv/año de otros diálogos. | Unificar límites. | baja | bajo | abre (app); consola sin errores |
| `ExperimentalValidationDialog` | Validación con medición | entrada del usuario | fórmula local | riesgo | Usa \|Δ\|/U_med sin combinar la incertidumbre del cálculo (Eₙ). | Eₙ = \|Δ\|/√(U₁² + U₂²). | baja | bajo | abre (app); consola sin errores |
| `ExposureRateProjectionDialog` | Proyección de tasa vs tiempo | entrada del usuario | fórmula local | riesgo | Dosis de 5 años con ocupación 8760 h/año fija; título en inglés. | Hacer editable la ocupación; traducir. | baja | bajo | abre (app); consola sin errores |
| `ExternalConnectorDialog` | Conectores externos | tabla fija en el diálogo | ninguno (informativo) | riesgo | Catálogo; textos en inglés. | Traducir. | baja | bajo | abre (app); consola sin errores |
| `FLUKAInputGenerator` | Generador de entrada FLUKA | entrada del usuario | generador de texto | riesgo | Textos en inglés; no validado con FLUKA. | Traducir; prueba de sintaxis. | baja | bajo | abre (montado aislado); consola sin errores |
| `GATESimulationDialog` | Macros GATE PET/SPECT | entrada del usuario | generador de texto (nuclearMedicine) | riesgo | Generador; textos en inglés. | Traducir. | baja | bajo | abre (app); consola sin errores |
| `GMPCyclotronCertificationDialog` | Certificación GMP de ciclotrón | tabla fija en el diálogo | ninguno (informativo) | OK | Checklist; sin DialogTitle. | Título accesible. | baja | bajo | abre (app); calcula al pulsar «Generar Reporte»; consola sin errores |
| `GammaIndexAnalyzer` | Índice gamma | datos sintéticos | fórmula local | riesgo | Distribuciones con ruido; aviso sintético. | Importar distribuciones reales. | baja | alto | abre (montado aislado); consola sin errores |
| `GeometrySelectorDialog` | Selector de geometrías de fuente | tabla fija en el diálogo | ninguno (informativo) | riesgo | Catálogo de 16 geometrías sin cálculo; inglés. | Conectar con un cálculo punto-kernel o retirar. | baja | medio | abre (app); calcula al pulsar «Truncated Cone»; consola sin errores |
| `HeatMapViewer` | Heat map avanzado (visor en revisión) | plano del proyecto (useCanvasStore/props) | doseFieldEngine | riesgo | Tras VISOR_HEATMAP=false. | Activar tras validación visual. | baja | bajo | abre (montado aislado); consola sin errores |
| `ICRU57Dialog` | ICRU 57 coeficientes de conversión | tabla fija en el diálogo | ninguno (informativo) | riesgo | Fase 8c: aviso de coeficientes sin verificar (no coinciden con ICRP 74). | Verificar contra la tabla A.17 del informe. | baja | bajo | abre (app); calcula al pulsar «Calculadora»; consola sin errores |
| `IPEMReport109Dialog` | Blindaje SPECT (IPEM 109) | entrada del usuario | lib/spect/IPEMReport109.salaSPECT | riesgo | Fase 8c: TVL continuo, sala dimensionada por la suma, Tc-99m/Tl-201 con TVL (no HVL), yeso por densidad. Siguen siendo TVL de haz estrecho. | Transmisión de banda ancha por nucleido. | baja | medio | abre (app); consola sin errores |
| `IndustrialRadiationDialog` | Radiografía industrial | entrada del usuario | lib/industrialRadiation | riesgo | Distancias de control con Γ; textos en inglés. | Traducir. | baja | bajo | abre (app); consola sin errores |
| `IsodosisViewer` | Curvas de isodosis (visor en revisión) | plano del proyecto (useCanvasStore/props) | doseFieldEngine | riesgo | Tras VISOR_ISODOSIS=false. | Activar tras validación visual. | baja | bajo | abre (montado aislado); consola sin errores |
| `Isosurface3DDialog` | Isosuperficie 3D (visor en revisión) | plano del proyecto (useCanvasStore/props) | visoresDosis.malla3DPlano | riesgo | Tras VISOR_ISOSUPERFICIE=false (no se monta). | Activar tras validación visual. | baja | bajo | abre (montado aislado); consola sin errores |
| `JENDL5DataViewer` | Visor de datos JENDL-5 | tabla fija en el diálogo | ninguno (informativo) | riesgo | Valores «representativos»; sin DialogTitle; inglés. | Título; traducir. | baja | bajo | abre (montado aislado); consola sin errores |
| `LayoutBunkerDialog` | Layouts y zona controlada | plano del proyecto (useCanvasStore/props) | controlledZone* | OK | Con pruebas; sin DialogTitle. | Título accesible. | baja | bajo | abre (montado aislado); consola sin errores |
| `LogFileAnalysisDialog` | Análisis de log planificado vs entregado | datos de demostración (MOCK_LOGS) | ninguno (informativo) | riesgo | Fase 8c: Rotulado con DatosEjemploBanner (datos de ejemplo). | Leer un log real. | baja | medio | abre (app); consola sin errores |
| `MCCloudDialog` | Monte Carlo en la nube | resultados aleatorios | ninguno | riesgo | Rotulado desde la Fase 6 (resultados aleatorios). | Conectar a un backend real o retirar. | baja | alto | no se monta aislado (le faltan props/proveedores que la app sí pasa); consola sin errores |
| `MCNPCyclotronDialog` | MCNP ciclotrón y neutrones | entrada del usuario | fórmula local (Q·h/(4πr²)) | riesgo | Fase 8c: Q = Y·I, 1/(4πr²), coeficiente fluencia→H*(10) editable (ICRP 74, 1 MeV), unidades μSv coherentes; estado «CUMPLE» ya no invertido; sin factor de laberinto propio. | Validar con la corrida MCNP o datos del fabricante. | baja | medio | abre (app); calcula al pulsar «Calculator»; consola sin errores |
| `MCNPGUIDeckGenerator` | Generador de mazo MCNP | entrada del usuario | generador de texto | riesgo | Comentario de conversión F6 incorrecto (MeV/g → Gy es ×1.602×10⁻¹⁰). | Corregir el comentario. | baja | bajo | abre (montado aislado); consola sin errores |
| `MCResultsDialog` | Resultados Monte Carlo | props (`lastMCResult`, nunca asignado) | curvas sintéticas | riesgo | Fase 8c: Rotulado con DatosEjemploBanner (datos de ejemplo). Se abre sólo con resultados importados. | Abrir al importar resultados reales. | baja | medio | abre (app); consola sin errores |
| `MLPredictionDialog` | Predictor ML de espesor | modelo entrenado con espesores NCRP 151 | useAutoML + espesorReferenciaNCRP151 | riesgo | Fase 8a: datos de entrenamiento y benchmark con `barreraMV`; se quitaron los «ejemplos reales» sin fuente; clave del modelo v2. El modelo sigue siendo una aproximación del motor. | Mostrar siempre el benchmark NCRP 151 junto a la predicción. | baja | bajo | abre (app); calcula al pulsar «Calculate with NCRP 151»; consola sin errores |
| `MaintenanceLogDialog` | Registro de mantenimiento | estado local | ninguno (informativo) | OK | Sin DialogTitle. | Título accesible. | baja | bajo | abre (app); consola sin errores |
| `MaterialPropertyCalculator` | Propiedades de materiales (Phy-X) | entrada del usuario | lib/phyXData | riesgo | Z_eff y μ/ρ propios sin prueba contra Phy-X/XCOM; inglés. | Prueba contra XCOM. | baja | medio | abre (app); calcula al pulsar «Calculate Properties»; consola sin errores |
| `MemoriaAnaliticaWizard` | Memoria analítica paso a paso | entrada del usuario | uaqProtocol (LINAC) | riesgo | Fase 8c: P según el área (0.1 controlada / 0.02 no controlada) con selector por área. | Usar `barreraMV`; tipar los 21 `any`. | baja | medio | abre (montado aislado); consola sin errores |
| `MonteCarloEngine` | Motor de dosis «Monte Carlo» (RX/TC) | entrada del usuario | fórmulas empíricas | riesgo | Rotulado desde la Fase 6 (modelo empírico, no Monte Carlo). | Renombrar o retirar. | baja | medio | abre (montado aislado); calcula al pulsar «Run Simulation»; consola sin errores |
| `MonteCarloIntegrationDialog` | Integración Monte Carlo | entrada del usuario | lib/monteCarloEngine | riesgo | Fase 8c: Rotulado con DatosEjemploBanner (datos de ejemplo). | Validar contra un caso de referencia. | baja | alto | abre (app); calcula al pulsar «Run MC Simulation»; consola sin errores |
| `MonteCarloSimulationWizard` | Asistente de simulación MC | datos sintéticos | fórmula local | riesgo | Rotulado desde la Fase 6 (mapa gaussiano). | Usar `mallaDosis` para el pre-cálculo. | baja | medio | abre (app); consola sin errores |
| `MultiSourceDetectorDialog` | Multi-fuente / multi-detector MC | entrada del usuario | lib/multiSourceDetector | riesgo | Fase 8c: Rotulado con DatosEjemploBanner (datos de ejemplo). | Validar contra `dosisEnPunto`. | baja | medio | abre (app); calcula al pulsar «Run Simulation»; consola sin errores |
| `NCRP151TablesDialog` | Tablas NCRP 151 | lib/ncrp151Tables | ninguno (informativo) | riesgo | Tablas independientes de `ncrp151.ts` (posible divergencia); sin DialogTitle. | Mostrar las tablas de `ncrp151.ts`. | baja | bajo | abre (app); consola sin errores |
| `NativeMCDialog` | Motor Monte Carlo nativo | entrada del usuario | lib/nativeMCEngine (transporte con RNG propio) | riesgo | Fase 8c: Rotulado con DatosEjemploBanner (datos de ejemplo). | Validar contra transmisión de banda ancha conocida. | baja | alto | abre (app); calcula al pulsar «Run Simulation»; consola sin errores |
| `NeutronRemovalDialog` | Sección eficaz de remoción Σᵣ | entrada del usuario | lib/phyXData | riesgo | Tasa en rem/h para «1 Ci» sin especificar fuente; inglés. | Unidades SI; traducir. | baja | bajo | abre (app); calcula al pulsar «Calculate»; consola sin errores |
| `NistXcomDialog` | Coeficientes XCOM | entrada del usuario | xcomAttenuation | riesgo | Transmisión de haz estrecho; 3 advertencias exhaustive-deps. | Rotular «haz estrecho». | baja | bajo | abre (app); consola sin errores |
| `NuclearDoseGrid` | Malla de dosis de medicina nuclear | entrada del usuario | lib/mallaNuclear (Γ por MBq + Tabla V) | riesgo | Fase 8a: Γ por MBq y Tabla V; para nucleidos no PET la barrera no se acredita (conservador). | Transmisión de banda ancha validada para Tc-99m, I-131 y Lu-177 cuando haya fuente. | baja | medio | abre (app); consola sin errores |
| `NuclearMedicineAdvanced` | Medicina nuclear avanzada | entrada del usuario | espesorPET (TG-108 Tabla V) para β+ | riesgo | Fase 8c: F-18/Ga-68/Cu-64 con banda ancha de TG-108 (antes 13.6 mm Pb, no conservador); resto con TVL de biblioteca rotulado. | Banda ancha validada para el resto de nucleidos. | baja | medio | abre (app); consola sin errores |
| `NuclideLibrary500Dialog` | Biblioteca de radionúclidos | tabla fija en el diálogo | ninguno (informativo) | riesgo | Se anuncia «500+» con ~40 nucleidos. | Renombrar o ampliar. | baja | bajo | abre (app); consola sin errores |
| `PACSIntegrationDialog` | Integración PACS | datos de demostración | ninguno (informativo) | riesgo | Fase 8c: estudios de demostración anonimizados y rotulados. | Traducir. | baja | bajo | abre (app); consola sin errores |
| `PENELOPEInputGenerator` | Generador PENELOPE | entrada del usuario | generador de texto | riesgo | Inglés. | Traducir. | baja | bajo | abre (montado aislado); consola sin errores |
| `PHITSInputGenerator` | Generador PHITS | entrada del usuario | generador de texto | riesgo | Inglés; sin DialogTitle. | Traducir; título. | baja | bajo | abre (montado aislado); consola sin errores |
| `Parametric3DDialog` | Primitivas 3D | estado local | ninguno (informativo) | error | Inaccesible (nada lo abre); 2 errores ESLint no-unused-expressions. | Enlazar o retirar. | baja | bajo | abre (app); consola sin errores |
| `ParametricBunkerDesigner` | Diseñador paramétrico de búnker | entrada del usuario | lib/bunkerParametrico | OK | Fase 8c: «Generar» crea el plano (4 barreras a escala y la fuente) sin espera simulada. | Añadir el laberinto al plano generado. | baja | medio | abre (app); consola sin errores |
| `PerformanceDashboardDialog` | Tablero de rendimiento | valores aleatorios | ninguno (informativo) | riesgo | Fase 8c: Rotulado con DatosEjemploBanner (datos de ejemplo). | Medir con `performance` o retirar. | baja | medio | abre (app); consola sin errores |
| `PlanValidatorDialog` | Validador de planos | plano del proyecto (useCanvasStore/props) | reglas locales | riesgo | Supone un lienzo de 1200×800 px para el área. | Usar el tamaño real del plano. | baja | bajo | abre (app); calcula al pulsar «Validar»; consola sin errores |
| `PointCloudImportDialog` | Importar nube de puntos | tabla fija en el diálogo | ninguno (informativo) | riesgo | Sólo información; inglés. | Traducir u ocultar. | baja | bajo | abre (app); consola sin errores |
| `PythonIntegrationDialog` | Python (Pyodide) | entrada del usuario | código de ejemplo | riesgo | El ejemplo usa P(mSv)/W(cGy) con un solo TVL. | Corregir el ejemplo. | baja | bajo | abre (app); calcula al pulsar «Code Runner»; consola sin errores |
| `RealTime3DDialog` | Exploración 3D | plano del proyecto (useCanvasStore/props) | realTime3DEngine (three) | riesgo | Usa un plano de demostración si no hay barreras; advertencia de GPU en consola. | Mostrar vacío en lugar de demo. | baja | bajo | abre (app); consola sin errores |
| `RegulatoryAlertsDialog` | Alertas regulatorias | ninguna fuente oficial | ninguno (informativo) | OK | Fase 8b: se quitaron las alertas inventadas; estado vacío que remite a DOF y CNSNS. | Conectar a una fuente oficial si se desea. | baja | medio | abre (app); consola sin errores |
| `RegulatoryComparisonDialog` | Comparación regulatoria | lib/internationalRegulations | ninguno (informativo) | riesgo | Inglés. | Traducir. | baja | bajo | abre (app); consola sin errores |
| `RevitAddinDialog` | Plantillas add-in Revit | tabla fija en el diálogo | ninguno (informativo) | riesgo | El C# divide coordenadas de lienzo (px) entre 304.8 como si fueran mm. | Convertir con la escala del plano. | baja | bajo | abre (app); consola sin errores |
| `SelfShieldingDialog` | Autoblindaje del paciente | tabla fija en el diálogo | ninguno (informativo) | riesgo | Factores propios (PET F-18 0.70) en vez de 1 − 0.36 de TG-108. | Usar `ABSORCION_PACIENTE`. | baja | bajo | abre (app); consola sin errores |
| `ShapesReconstructionDialog` | Reconstrucción de formas | datos sintéticos | fórmula local | riesgo | Fase 8c: Rotulado con DatosEjemploBanner (datos de ejemplo). | Usar RTSTRUCT real. | baja | medio | abre (app); consola sin errores |
| `SourceLibraryDialog` | Biblioteca de fuentes | tabla fija en el diálogo | fuente puntual A·Γ/d² | riesgo | Fase 8c: Γ en μGy·m²/(MBq·h) con distancia; Co-60 corregido (0.306); sólo calcula con Γ verificadas. | Verificar el resto de Γ y las geometrías integradas. | baja | medio | abre (app); consola sin errores |
| `SpecialCasesDialog` | Casos especiales | lib/specialCases | fórmula local (Γ·A/d²) | riesgo | Sin DialogTitle. | Título accesible. | baja | bajo | abre (app); calcula al pulsar «PDF»; consola sin errores |
| `TherapyShieldingDialog` | Blindaje de terapia con radionúclidos | entrada del usuario | lib/therapy (límite una vez, TVL continuo) | riesgo | Fase 8c: la sala se compara con la meta una vez; número de TVL continuo; unidad de Γ corregida (por MBq). | Verificar los TVL de la biblioteca de nucleidos. | baja | medio | abre (app); consola sin errores |
| `TransmissionCurveDialog` | Curvas de transmisión de certificado | archivo del usuario | ninguno (informativo) | riesgo | Título en inglés. | Traducir. | baja | bajo | abre (app); consola sin errores |
| `UncertaintyQuantificationDialog` | Incertidumbre GUM | entrada del usuario | lib/gumUncertainty | OK | Presupuesto GUM; título parcialmente en inglés. | Traducir. | baja | bajo | abre (app); calcula al pulsar «Compute GUM Budget»; consola sin errores |
| `VersionHistoryDialog` | Historial de versiones | datos de demostración (DEMO_VERSIONS) | ninguno (informativo) | riesgo | Versiones ficticias; inglés. | Leer versiones guardadas. | baja | medio | abre (app); consola sin errores |
| `VideoTutorialGenerator` | Videotutoriales | tabla fija en el diálogo | ninguno (informativo) | riesgo | Inglés. | Traducir. | baja | bajo | abre (app); calcula al pulsar «How to Calculate a Primary Bar»; consola sin errores |
| `AAPMTG108PETDialog` | Blindaje PET por procedimiento (TG-108) | entrada del usuario | tg108.dosisSemanalTG108 + transmisionPET | OK | Fase 8a: dosis TG-108 con absorción y decaimiento, Tabla V; reproduce el Ejemplo 2 (59.7 μSv, ≈ 8 mm Pb); TC fuera. | — | — | — | abre (app); consola sin errores |
| `AboutDialog` | Acerca de | tabla fija en el diálogo | ninguno (informativo) | OK | Texto institucional. | — | — | — | abre (app); consola sin errores |
| `AlaraWizardDialog` | Sustitución de materiales (costo/espacio) | tabla fija en el diálogo | ComparadorMateriales (espesorRequeridoHaz + compararMateriales) | OK | Fase 8c: sin porcentajes fijos ni cita comercial; equivalencias desde el espesor normativo de cada material. | — | — | — | abre (app); consola sin errores |
| `AnalyticsDialog` | Analítica de uso local | useAnalytics (localStorage) | ninguno (informativo) | OK | Métricas de uso locales. | — | — | — | abre (app); consola sin errores |
| `BarrierCalculatorDialog` | Calculadora de barreras MV (NCRP 151) | entrada del usuario | calculadorasNormativas.barreraMV → ncrp151 | OK | Fase 7: primaria/fuga/dispersión, TVL₁/TVLₑ, dos fuentes, cumple sólo si T·K ≤ P; validada con §7.1.1 y §7.1.5. | — | — | — | abre (app); calcula al pulsar «Calcular»; consola sin errores |
| `BatchCalculationDialog` | Cálculo por lotes del plano | plano del proyecto (useCanvasStore/props) | useShieldingEngine → normativeBarrierEngine | OK | Fase 7: mismo motor que el diseñador; validado con el DXF de la Fase 4. | — | — | — | abre (app); calcula al pulsar «Calcular»; consola sin errores |
| `BatchReportExporterDialog` | Exportar reportes JSON/CSV | plano del proyecto (useCanvasStore/props) | ninguno (informativo) | OK | Exporta el plano. | — | — | — | abre (app); consola sin errores |
| `BibliographyDialog` | Bibliografía | lib/bibliography | ninguno (informativo) | OK | Catálogo de referencias. | — | — | — | abre (app); consola sin errores |
| `BraquiterapiaCo60Dialog` | Braquiterapia HDR Co-60 (anexo CNSNS) | datos fijos de una instalación | CalculadoraCo60 → blindajeCo60 (NCRP 151 B.2) | OK | Fase 8c: entradas editables (W, d, P, T, U) y espesores TVL₁/TVLₑ de Co-60 de la Tabla B.2. | — | — | — | abre (app); calcula al pulsar «Calculadora»; consola sin errores |
| `CADGeometryConverterDialog` | Guía CAD→GDML/ROOT | tabla fija en el diálogo | ninguno (informativo) | OK | Contenido metodológico. | — | — | — | abre (app); consola sin errores |
| `CNSNSAutoReportDialog` | Reporte CNSNS desde el proyecto | plano del proyecto | lib/reporteCNSNSHtml + verificarBarrera | OK | Fase 8b: sin resultados fijos; sin barreras calculadas muestra estado vacío y no genera. | — | — | — | abre (app); consola sin errores |
| `CNSNSDashboardDialog` | Tablero CNSNS | plano del proyecto (useCanvasStore/props) | ninguno (informativo) | OK | Resume kerma máximo de las barreras del plano. | — | — | — | abre (app); consola sin errores |
| `CNSNSDialog` | Memoria analítica CNSNS (DOCX) | plano del proyecto (useCanvasStore/props) | useCNSNSReport (docx) | OK | Genera el DOCX con los resultados del plano. | — | — | — | abre (app); calcula al pulsar «Generar y Descargar DOCX»; consola sin errores |
| `CategoryToolsDialog` | Herramientas por categoría | tabla fija en el diálogo | ninguno (informativo) | OK | Fase 8c: diagnóstico → MultiEnergySpectra (NCRP 147), PET → TG-108, SPECT → IPEM 109, terapia con radiofármacos → TherapyShielding; megavoltaje sigue en la calculadora MV. | — | — | — | abre (app); consola sin errores |
| `CertificationModeDialog` | Checklist LA-007/01 | tabla fija en el diálogo | ninguno (informativo) | OK | Lista de verificación. | — | — | — | abre (montado aislado); consola sin errores |
| `ChecklistCNSNSDialog` | Checklist pre-CNSNS | tabla fija en el diálogo | ninguno (informativo) | OK | Lista de verificación. | — | — | — | abre (app); calcula al pulsar «Distancias fuente-punto de cal»; consola sin errores |
| `CloudSyncDialog` | Sincronización en la nube | backend (lib/cloudSync) | ninguno (informativo) | OK | Requiere backend. | — | — | — | abre (app); consola sin errores |
| `CommandPalette` | Paleta de comandos | props | ninguno (informativo) | OK | Título sr-only (Fase 6). | — | — | — | abre (montado aislado); consola sin errores |
| `ComplianceCertificationDialog` | Cumplimiento y certificaciones | checklists de lib/internationalRegulations | ninguno (informativo) | OK | Fase 8b: se quitaron las certificaciones inexistentes (CE, FDA, ISO); estado vacío honesto. | — | — | — | abre (app); consola sin errores |
| `CostOptimizerDialog` | Optimizador de costos | entrada del usuario | ComparadorMateriales | OK | Fase 8c: espesor con TVL₁/TVLₑ o Archer y costo por masa; peso del costo dominante. | — | — | — | abre (app); consola sin errores |
| `CrossValidationDialog` | Comparación de métodos NCRP 151 | entrada del usuario | barreraMV | OK | Fase 8a: compara Ec. 2.3 (TVL₁/TVLₑ) con TVL único; reproduce §7.1.1. | — | — | — | abre (app); consola sin errores |
| `DICOMDialog` | Importar DICOM | archivo del usuario | useDICOM | OK | Lectura de cabeceras. | — | — | — | abre (app); consola sin errores |
| `DXFViewerDialog` | Visor e importación DXF | archivo del usuario | dxfParser + cadBimBridge | OK | Validado de punta a punta en la Fase 4. | — | — | — | abre (app); consola sin errores |
| `DashboardCalcDialog` | Tablero ejecutivo de cálculo | plano del proyecto (useCanvasStore/props) | verificacionBlindaje.verificarPlano | OK | Fase 8c: cumple sólo si instalado ≥ requerido; sin espesor por omisión ni límites mezclados. | — | — | — | abre (app); consola sin errores |
| `DoseMapDialog` | Mapa de dosis 2D/3D | plano del proyecto (useCanvasStore/props) | doseFieldEngine (mallaDoseMap) | OK | Validado (Fases 3–5). | — | — | — | abre (app); consola sin errores |
| `DxfExportDialog` | Exportar plano DXF/SVG/JSON | plano del proyecto (useCanvasStore/props) | lib/dxfExport | OK | Fase 7: exporta el proyecto; DXF reimportable (prueba de ida y vuelta). | — | — | — | abre (app); consola sin errores |
| `EPAGuidanceDialog` | Guía EPA FGR 14 | tabla fija en el diálogo | ninguno (informativo) | OK | Fase 8c: corregido «controlada NCRP 147 = 20 μSv/semana» (es el objetivo no controlado; controlada 0.1). | — | — | — | abre (app); calcula al pulsar «ALARA y Optimizacion de Dosis»; consola sin errores |
| `EquipmentDBDialog` | Base de datos de equipos | tabla fija en el diálogo | ninguno (informativo) | OK | Catálogo («Infinity» es un modelo Elekta, no un error). | — | — | — | abre (app); consola sin errores |
| `EquipmentLibraryDialog` | Biblioteca de equipos | tabla fija en el diálogo | ninguno (informativo) | OK | Fase 8c: Co-60 21/4.0 cm (Tabla B.2), 511 keV 1.er TVL de TG-108 (1.6 cm Pb, 19 cm concreto), Ir-192/Tc-99m/I-131 con TVL (no HVL). | — | — | — | abre (app); consola sin errores |
| `ExportDialog` | Exportar resultados | plano del proyecto (useCanvasStore/props) | ninguno (informativo) | OK | — | — | — | — | abre (app); consola sin errores |
| `FloorCeilingDialog` | Blindaje de piso y techo | entrada del usuario | hooks/useFloorCeilingCalc → barreraMV | OK | Fase 8a: corregido el ×1000; techo y piso como barreras primarias (y secundarias) NCRP 151. | — | — | — | abre (app); consola sin errores |
| `FloorPlanFeaturesPanel` | Herramientas del plano | plano del proyecto (useCanvasStore/props) | ninguno (informativo) | OK | — | — | — | — | abre (app); calcula al pulsar «Generar»; consola sin errores |
| `GammaKnifeDialog` | Gamma Knife (anexo técnico) | tabla fija en el diálogo | CalculadoraCo60 → blindajeCo60 | OK | Fase 8c: fórmula corregida (B = P/(T·U·D)); el ejemplo S1a ya no da 9.4 cm (B > 1: sin blindaje); calculadora editable. | — | — | — | abre (app); calcula al pulsar «Calculo»; consola sin errores |
| `Geant4McDialog` | Referencia analítica TG-108 para Geant4 | entrada del usuario | calculadorasNormativas.blindajePET | OK | Fase 7: sin Monte Carlo simulado; validado con Tabla V. | — | — | — | abre (app); consola sin errores |
| `GlossaryDialog` | Glosario | tabla fija en el diálogo | ninguno (informativo) | OK | — | — | — | — | abre (app); consola sin errores |
| `ICRU96Dialog` | ICRU 96 radiofármacos | tabla fija en el diálogo | ninguno (informativo) | OK | Datos de referencia. | — | — | — | abre (app); calcula al pulsar «Calculadora»; consola sin errores |
| `InternationalRegulationsDialog` | Base de regulaciones | lib/internationalRegulations | ninguno (informativo) | OK | — | — | — | — | abre (app); consola sin errores |
| `KeyboardConfigDialog` | Configurar atajos | localStorage | ninguno (informativo) | OK | — | — | — | — | abre (app); consola sin errores |
| `KeyboardShortcutsDialog` | Atajos de teclado | localStorage | ninguno (informativo) | OK | — | — | — | — | abre (app); consola sin errores |
| `LaminatedBarrierCalculator` | Barrera laminada (McGinley) | entrada del usuario | blindajeMulticapa (MultiLayerShieldDialog) | OK | Fase 8c: mismo cálculo multicapa de la Fase 7. | — | — | — | abre (montado aislado); consola sin errores |
| `MCConfigDialog` | Configurar simulación MC | entrada del usuario | ninguno (informativo) | OK | — | — | — | — | abre (app); consola sin errores |
| `MCDialog` | Exportar macros GEANT4/GATE | plano del proyecto (useCanvasStore/props) | useMCBridge | OK | — | — | — | — | abre (app); calcula al pulsar «Generar y Descargar Macros MC»; consola sin errores |
| `ManualDialog` | Manual de usuario | tabla fija en el diálogo | ninguno (informativo) | OK | Fase 8c: §3.1 describe el motor real (K¹, Archer por distribución, NCRP 151, TG-108). | — | — | — | abre (app); calcula al pulsar «3.3 NSGA-II Optimizer (v32)»; consola sin errores |
| `MaterialComparisonDialog` | Comparación de materiales (XCOM) | entrada del usuario | ComparadorMateriales + XCOM (informativo) | OK | Fase 8c: comparador normativo arriba; la tabla de haz estrecho queda rotulada como no apta para dimensionar. | — | — | — | abre (app); consola sin errores |
| `MaterialLibraryDialog` | Biblioteca de materiales | backend (props) | ninguno (informativo) | OK | Fase 8c: accesible desde la barra lateral (herramientas). | — | — | — | abre (app); consola sin errores |
| `MazeCalculatorDialog` | Laberinto y puerta (NCRP 151 §2.4) | entrada del usuario | ncrp151Laberinto | OK | Validado con §7.1 (Fase 4). | — | — | — | abre (app); consola sin errores |
| `MedicalFloorPlan3DDialog` | Plano médico 3D | plano del proyecto (useCanvasStore/props) | doseFieldEngine + sceneBuilder (r3f; Babylon tras bandera) | OK | Fase 8d: dividido en `medical3d/` (hooks de estado, contratos y exportaciones; paneles; escena R3F) con pruebas de no-regresión previas. Babylon sigue tras su bandera (false); el aviso THREE.Clock viene de @react-three/fiber. | Validar visualmente antes de activar Babylon. | sin acción | — | abre (app); calcula al pulsar «Entrada / vista general»; 2 aviso(s)/error(es) de consola |
| `MemoriaAIWizard` | Asistente de memoria IA | plano del proyecto (useCanvasStore/props) | analyticMemoryEvidence + f* | OK | Fase 8c: TVL de los perfiles corregidos (Co-60 B.2, 511 keV TG-108, Tc-99m e Ir-192 con TVL y no HVL). | — | — | — | abre (montado aislado); calcula al pulsar «Calcular blindaje»; consola sin errores |
| `ModelingToolboxDialog` | Calculadoras rápidas | entrada del usuario | fórmulas locales | OK | Fase 8c: skyshine con la Ec. 5.1 de NCRP 151; textos en español. | — | — | — | abre (app); calcula al pulsar «Quick Calculators»; consola sin errores |
| `MultiEnergySpectraDialog` | Blindaje con espectros polienergéticos (NCRP 147) | entrada del usuario | espesorRequeridoHaz (Archer B.1/C.1) + blindajeTC (§5.6.1, Figs. A.2/A.3) | OK | Fase 8: el espectro entra por los ajustes de Archer de cada distribución de carga y, en TC, por el método DLP; se quitaron los TVL «TASMIP» sin fuente (0.30 mm Pb a 120 kVp). Reproduce §5.3.3.1 (1.3 mm Pb), §5.3.1.1 (107 mm) y §5.6.1 (1.5 mm Pb). HVL sólo informativos. | — | — | — | abre (app); consola sin errores |
| `MultiLayerShieldDialog` | Blindaje multicapa | entrada del usuario | calculadorasNormativas.blindajeMulticapa | OK | Fase 7: transmisión NCRP 147/151 por capa y K¹; probado. | — | — | — | abre (app); consola sin errores |
| `MultiObjectiveOptimizerDialog` | Optimizador de materiales PET | entrada del usuario | blindajePET + compararMateriales | OK | Fase 7: TG-108 y frente de Pareto. | — | — | — | abre (app); consola sin errores |
| `NCRPValidationDialog` | Suite de validación | motor real | normativeBarrierEngine, ncrp147/151, tg108 | OK | Fase 8b: 17 casos recalculados con el motor contra NCRP 147 §5, NCRP 151 §7.1 y TG-108; fallan si el motor se desvía. | — | — | — | abre (app); calcula al pulsar «Ejecutar Validacion»; consola sin errores |
| `NISTLibraryDialog` | Biblioteca NIST | lib/nistMaterialLibrary | ninguno (informativo) | OK | — | — | — | — | abre (app); consola sin errores |
| `NeutronDialog` | Neutrones (>10 MV) | entrada del usuario | hooks/useNeutronCalc → ncrp151Laberinto | OK | Fase 8a: H₀ de la Tabla B.9 y BPE con `puerta()` (§7.1.13); ya no multiplica n TVL por la HVL. Captura y fotones en «Laberinto y puerta». | — | — | — | abre (app); consola sin errores |
| `NeutronMazeDialog` | Laberinto de neutrones | entrada del usuario | redirige a maze (ncrp151Laberinto) | OK | Fase 8c: se retiró el modelo 10^(−L/TVL); abre la calculadora de laberinto validada. | — | — | — | abre (app); consola sin errores |
| `NeutronShieldingDialog` | Blindaje de neutrones (v109) | entrada del usuario | redirige a neutron (useNeutronCalc) | OK | Fase 8c: se retiró el modelo con Gy/h × Gy/semana; abre el diálogo de neutrones validado. | — | — | — | abre (app); consola sin errores |
| `NuclideDataViewer` | Datos de nucleidos (ICRP) | tabla fija en el diálogo | ninguno (informativo) | OK | — | — | — | — | abre (app); consola sin errores |
| `ObliqueIncidenceDialog` | Corrección por incidencia oblicua | entrada del usuario | incidenciaOblicua → correccionOblicuidad (NCRP 151 §2.2) | OK | Fase 8c: recorrido t/cos θ con tope 70° y corrección de §2.2 para θ > 45°. | — | — | — | abre (app); consola sin errores |
| `OnnxPredictorDialog` | Espesor PET (TG-108) | entrada del usuario | blindajePET | OK | Fase 7: TG-108 Ejemplo 1 reproducido. | — | — | — | abre (app); consola sin errores |
| `PACSRealDialog` | PACS Orthanc | Orthanc o lista de demostración | ninguno (informativo) | OK | Fase 8c: demostración anonimizada y rotulada. | — | — | — | abre (app); consola sin errores |
| `ParetoOptimizerDialog` | Comparación de materiales (Pareto) | entrada del usuario | espesorRequeridoHaz + compararMateriales | OK | Fase 7: NCRP 151/147 con K¹; probado. | — | — | — | abre (app); consola sin errores |
| `PdfReportDialog` | Reporte PDF | plano del proyecto (useCanvasStore/props) | analyticMemoryEvidence | OK | — | — | — | — | abre (app); consola sin errores |
| `PerformanceRecommendations` | Recomendaciones de rendimiento | tabla fija en el diálogo | ninguno (informativo) | OK | — | — | — | — | abre (montado aislado); consola sin errores |
| `PredictiveMaterialDialog` | Optimización «predictiva» de material | entrada del usuario | ComparadorMateriales | OK | Fase 8c: sin TVL propios (plomo «0.5 cm»); comparador normativo. | — | — | — | abre (app); calcula al pulsar «Optimize Material»; consola sin errores |
| `ProjectManagerDialog` | Administrador de proyectos | IndexedDB/backend | ninguno (informativo) | OK | — | — | — | — | abre (app); consola sin errores |
| `RadioactiveTransportDialog` | Transporte de material radiactivo | tabla fija en el diálogo | ninguno (informativo) | OK | Fase 8c: categorías IAEA SSR-6 corregidas (IT ≤ 1 → ≤ 10 μSv/h a 1 m; IT ≤ 10 → ≤ 0.1 mSv/h). | — | — | — | abre (app); calcula al pulsar «Calculadora»; consola sin errores |
| `ReferenceLibraryDialog` | Biblioteca de referencias (GAMMA) | servicio GAMMA | ninguno (informativo) | OK | Con pruebas. | — | — | — | abre (app); consola sin errores |
| `RegulatoryReportDialog` | Reporte regulatorio JSON | plano del proyecto (useCanvasStore/props) | analyticMemoryEvidence | OK | — | — | — | — | abre (app); calcula al pulsar «Generar Memoria Analitica JSON»; consola sin errores |
| `ReportManagerDialog` | Administrador de reportes | backend (props) | ninguno (informativo) | OK | Fase 8c: accesible desde la barra lateral (E/S). | — | — | — | abre (app); calcula al pulsar «Generar del Proyecto»; consola sin errores |
| `RevitIfcImportDialog` | Importación IFC de Revit | archivo del usuario | revitIntegration | OK | Fase 8c: la exportación declara scale_m_per_pixel = 0.01 (coordenadas m → px coherentes). | — | — | — | abre (app); consola sin errores |
| `STEPImporterDialog` | Importador STEP/IGES | archivo del usuario | lib/stepImporter | OK | Modo compatibilidad sin OpenCascade. | — | — | — | abre (app); consola sin errores |
| `ScenarioAnalysisDialog` | Análisis de escenarios | entrada del usuario | barreraMV | OK | Fase 7: P según área, NCRP 151 primaria; probado. | — | — | — | abre (app); consola sin errores |
| `SecondaryBarrierAlbedoDialog` | Método de albedo | entrada del usuario | redirige a maze (ncrp151Laberinto) | OK | Fase 8c: se retiró H·Πα(d/d)² sin área; abre la calculadora de laberinto (α·A). | — | — | — | abre (montado aislado); consola sin errores |
| `SelectorComponentesDosis` | Selector de componentes del campo | props | doseFieldEngine | OK | Subcomponente de los visores. | — | — | — | no se monta aislado (le faltan props/proveedores que la app sí pasa); consola sin errores |
| `SensitivityAnalysisDialog` | Sensibilidad del espesor | entrada del usuario | espesorRequeridoHaz (NCRP 147) | OK | Fase 7: §5.3.3.1 reproducido. | — | — | — | abre (app); consola sin errores |
| `ShieldingDesignAgentDialog` | Agente de diseño de blindaje | entrada del usuario | lib/agents/tools → barreraMV | OK | Accesible desde la barra de herramientas («Shielding Design Agent»); herramientas sobre `barreraMV` (Fase 8a). | — | — | — | abre (montado aislado); calcula al pulsar «Run Shielding Design Agent»; consola sin errores |
| `ShieldingOptimizerDialog` | Optimizador NSGA-II | entrada del usuario | lib/shieldingOptimizer → barreraMV | OK | Fase 8c: espesor por NCRP 151 (concreto/acero/plomo) y equivalencia de densidad para el resto (rotulada); P controlada 0.1. | — | — | — | abre (app); calcula al pulsar «Ejecutar Optimizacion»; consola sin errores |
| `ShieldingVerification` | Verificación de blindaje | plano del proyecto (useCanvasStore/props) | verificacionBlindaje | OK | Con pruebas. | — | — | — | abre (app); consola sin errores |
| `SketchPadDialog` | Croquis | estado local | ninguno (informativo) | OK | — | — | — | — | abre (app); consola sin errores |
| `SmartSearchDICOMDialog` | Búsqueda DICOM | datos de demostración | ninguno (informativo) | OK | Fase 8c: pacientes, MRN e institución anonimizados; rotulado. | — | — | — | abre (app); consola sin errores |
| `SpatialDoseMapDialog` | Mapa espacial de dosis | plano del proyecto (useCanvasStore/props) | doseFieldEngine | OK | Validado (Fases 3–6). | — | — | — | abre (app); consola sin errores |
| `SplashScreen` | Pantalla de inicio | tabla fija en el diálogo | ninguno (informativo) | OK | — | — | — | — | abre (montado aislado); consola sin errores |
| `StGermainScatterDialog` | Método de dispersión St-Germain | entrada del usuario | espesorRequeridoHaz (NCRP 147 secundaria) | OK | Fase 8c: K¹_sec de la Tabla 4.7 y Archer C.1; reproduce §5.3.1.2 (0.47 mGy/semana, 33 mm). | — | — | — | abre (app); consola sin errores |
| `TechSpecsDialog` | Especificaciones técnicas | tabla fija en el diálogo | ninguno (informativo) | OK | — | — | — | — | abre (app); consola sin errores |
| `TornadoSensitivityDialog` | Tornado (diagnóstico) | entrada del usuario | espesorRequeridoHaz (NCRP 147) | OK | Fase 8a: K con K¹ e inversa de Archer correcta; §5.3.3.1 (1.3 mm). | — | — | — | abre (app); consola sin errores |
| `TutorialDialog` | Tutorial | tabla fija en el diálogo | ninguno (informativo) | OK | — | — | — | — | abre (app); consola sin errores |
| `UndoRedoHistoryPanel` | Historial | props | ninguno (informativo) | OK | — | — | — | — | abre (montado aislado); consola sin errores |
| `UpdateAppDialog` | Centro de actualizaciones | contratos f* | ninguno (informativo) | OK | Diferido con lazy() (Fase 6). | — | — | — | abre (montado aislado); consola sin errores |
| `VentilationDialog` | Ventilación (Ar-41) | entrada del usuario | lib/ventilacionBunker | OK | Con referencia 10 CFR 20. | — | — | — | abre (app); consola sin errores |
| `VersaHD15MVDialog` | Elekta Versa HD 15 MV | entrada del usuario | calculadorasNormativas.barreraMV | OK | Fase 8a: corregido el error ×1000 (antes ≈ 84 cm, ahora ≈ 205 cm con sus valores iniciales, NCRP 151 Tabla B.2); IMRT sólo en la fuga. | — | — | — | abre (app); calcula al pulsar «Calculadora»; consola sin errores |
| `Viewer3DDialog` | Visor 3D GEANT4 | plano del proyecto | r3f | OK | Fase 8: etiqueta con <Html> en lugar de <Text> (sin descarga de fuentes de CDN). | — | — | — | abre (app); 1 aviso(s)/error(es) de consola |
| `VoxelPhantomDialog` | Fantomas voxelizados ICRP | tabla fija en el diálogo | ninguno (informativo) | OK | Catálogo con dibujo esquemático. | — | — | — | abre (app); consola sin errores |
