# AUDITORIA COMPLETA — RadShield-MX v50
## Recomendaciones Faltantes por Categoria

**Fecha:** 2025-06-03  
**Archivos fuente:** 353 (.ts + .tsx)  
**Lineas de codigo:** ~76,069  
**Dialogos:** 172  
**Tests unitarios:** 4 archivos  
**Referencia bibliografica:** 74 entradas

---

## RESUMEN EJECUTIVO

| Categoria | Recomendaciones | Prioridad | Estimacion |
|---|---|---|---|
| 1. Validacion y Verificacion (V&V) | 12 | CRITICA | 3 semanas |
| 2. Motor de Calculo — Mejoras Cientificas | 15 | CRITICA | 4 semanas |
| 3. Interfaz Grafica (UI/UX) | 18 | ALTA | 3 semanas |
| 4. APIs Web y Tecnologias | 10 | ALTA | 2 semanas |
| 5. Ingenieria de Software | 14 | ALTA | 3 semanas |
| 6. Documentacion y Regulatorio | 8 | MEDIA | 1 semana |
| 7. Comparativa con Herramientas Profesionales | 11 | MEDIA | 4 semanas |
| **TOTAL** | **88 recomendaciones** | | **~20 semanas** |

---

# 1. VALIDACION Y VERIFICACION (V&V) — PRIORIDAD CRITICA

### VV-01: Suite de Validacion contra NCRP 147 Tablas Publicadas
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Crear test suite que compare resultados del motor contra las tablas oficiales de NCRP 147 (Table A.2, A.3, A.4) y NCRP 151 (Table B.1-B.6). Diferencias >5% deben alertar.  
**Referencia:** Simpkin 1996, NCRP 147 Annex A  
**Impacto:** Si los calculos no coinciden con tablas publicadas, la aplicacion no es confiable para uso profesional.

### VV-02: Benchmark contra XRAYBARR (Simpkin)
**Estado:** NO IMPLEMENTADO  
**Descripcion:** XRAYBARR es el software de referencia gratuito del Dr. Simpkin. Implementar los 12 worked examples de NCRP 147 como tests de integracion y comparar salida.  
**Referencia:** http://www.simpkin.com  
**Impacto:** Validacion externa independiente.

### VV-03: Scatter Fraction Especifico por Modelo de CT
**Estado:** NO IMPLEMENTADO  
**Descripcion:** NCRP 147 usa valores fijos de kappa que pueden variar 82% entre modelos de CT. Implementar base de datos de kappa por modelo (GE, Siemens, Philips, Canon, Toshiba).  
**Referencia:** Larson et al. Health Phys 2007;93(2):S85-S91. PMID: 17622822  
**Impacto:** Errores de 0.5-13% en blindaje CT usando kappa generico.

### VV-04: AAPM TG 108 PET Shielding Validation
**Estado:** PARCIAL (tenemos TG 108 kerma pero no validacion contra tablas)  
**Descripcion:** Implementar los 8 casos de test de AAPM TG 108 para validar calculos PET/CT shielding.  
**Referencia:** AAPM TG 108, Med Phys 33(1), 2006  
**Impacto:** PET shielding es el caso de uso mas comun; requiere validacion rigurosa.

### VV-05: Comparacion Isodose con Metodos Independientes
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Para mapas de dosis 2D, comparar contra: (a) metodo analitico punto-a-punto, (b) interpolacion de NCRP 147 Fig 4.5, (c) datos de BIR 2012.  
**Referencia:** BIR 2012, NCRP 147 Fig 4.5  
**Impacto:** Verificar que los heatmaps son fisicamente correctos.

### VV-06: QA Benchmarking Suite (Requisito Regulatorio)
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Las regulaciones (NOM-040, CNSNS) requieren que el software de calculo sea benchmarked regularmente. Implementar suite automatizada que corra mensualmente y genere reporte de compliance.  
**Referencia:** NOM-040-NUCL-2016, NCRP 147 Sec. 7  
**Impacto:** Requisito legal para uso clinico en Mexico.

### VV-07: Test de Regresion Visual para Canvas
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Usando playwright o puppeteer, capturar screenshots del canvas para configuraciones estandar y comparar con referencia. Detectar cambios visuales inesperados.  
**Referencia:** Best practices for canvas testing  
**Impacto:** Prevenir bugs visuales que afectan interpretacion de resultados.

### VV-08: Validacion de Constantes de Exposicion
**Estado:** PARCIAL (tenemos test para F-18, Tc-99m, Lu-177)  
**Descripcion:** Extender tests para cubrir TODOS los radionucleidos (14+). Comparar gamma constants contra Smith & Stabin 2012, NIST, ICRP 107.  
**Referencia:** Smith & Stabin 2012, NIST  
**Impacto:** Asegurar que todas las constantes son correctas.

### VV-09: Monte Carlo Cross-Validation
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Para un caso simple (barrera de Pb, Fuente Co-60), comparar resultado analitico vs Geant4 vs MCNP6 vs nuestro motor. Documentar agreement.  
**Referencia:** Phy-X/PSD, MCNP5 cross-validation studies  
**Impacto:** Verificacion de que el motor analitico coincide con Monte Carlo.

### VV-10: Uncertainty Quantification (GUM)
**Estado:** PARCIAL (tenemos gumUncertainty.ts pero no integrado en resultados)  
**Descripcion:** Integrar propagacion de incertidumbre GUM en TODOS los calculos. Mostrar intervalo de confianza 95% en resultados.  
**Referencia:** GUM JCGM 100:2008, IAEA TECDOC-1588  
**Impacto:** Resultados sin incertidumbre son incompletos para regulatorio.

### VV-11: Sensitivity Analysis — Tornado Diagrams
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Para cada calculo de blindaje, generar diagrama de tornado que muestre como cambia el resultado al variar +/-20% cada parametro de entrada.  
**Referencia:** MicroShield Pro feature, Professional shielding software  
**Impacto:** Permite identificar que parametros son criticos y necesitan medicion precisa.

### VV-12: Peer Review Mode — Audit Trail Completo
**Estado:** PARCIAL (tenemos AuditTrailDialog pero no integrado en calculos)  
**Descripcion:** Cada calculo debe generar audit trail completo: quien, cuando, que parametros, que resultado, que version del software. Inmutable, exportable a PDF.  
**Referencia:** 21 CFR Part 11, NOM-040  
**Impacto:** Requisito para validacion regulatoria y peer review.

---

# 2. MOTOR DE CALCULO — MEJORAS CIENTIFICAS

### MC-01: AAPM TG 108 PET Shielding Calculator Completo
**Estado:** PARCIAL (tenemos NuclearMedicineAdvanced pero no TG 108 especifico)  
**Descripcion:** Implementar calculador dedicado AAPM TG 108 con: (a) kerma semanal por procedimiento PET, (b) atenuacion por pared, (c) consideracion de CT component, (d) tablas de AAPM TG 108 Annex.  
**Referencia:** AAPM TG 108, Med Phys 33(1):1-16, 2006  
**Impacto:** PET shielding es el 40% de los calculos de blindaje en medicina nuclear.

### MC-02: IPEM Report 109 — SPECT Shielding
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Implementar metodologia IPEM Report 109 para blindaje de salas SPECT y SPECT/CT. Incluye factores de dispersion especificos por radiofarmaco.  
**Referencia:** IPEM Report 109 (2014)  
**Impacto:** SPECT es el segundo metodo de medicina nuclear mas comun.

### MC-03: Blindaje para Fuentes Industriales (Ir-192, Co-60, Se-75)
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Actualmente solo cubrimos fuentes medicas. Ampliar a: gammagrafia industrial (Ir-192, Se-75, Co-60), medidores de nivel (Cs-137), densimetros (Am-Be).  
**Referencia:** ISO 3999, ANSI N43.3, NOM-011-NUCL  
**Impacto:** Amplia mercado a industria (petroleo, soldadura, etc.).

### MC-04: Blindaje para Aceleradores de Particulas (No medicos)
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Implementar blindaje para: sincrotrones, aceleradores de investigacion, irradiadores de alimentos, aceleradores de electrones industriales.  
**Referencia:** NCRP 144, IAEA SSG-8  
**Impacto:** Mercado de investigacion y agroindustria.

### MC-05: Skyshine Calculator Mejorado
**Estado:** PARCIAL (tenemos skyshine basico)  
**Descripcion:** Implementar metodo de Chilton et al. para skyshine de instalaciones de radioterapia. Incluir graficas de dosis vs distancia para diferentes angulos de irradiacion.  
**Referencia:** NCRP 151 Sec. 5.4, Chilton et al. Nucl Sci Eng 17:419, 1963  
**Impacto:** Skyshine es frecuentemente el limitante en blindaje de techo.

### MC-06: Ductos y Penetraciones (Maze + Ducto)
**Estado:** PARCIAL (tenemos MazeCalculator pero no ductos rectos)  
**Descripcion:** Implementar: (a) ductos rectos con multiple scattering, (b) ductos con codos, (c) penetraciones electricas/plomeria con sleeve shielding, (d) calculo de dosis al final de ducto.  
**Referencia:** NCRP 151 Sec. 4.4, McGinley 2002 Ch. 8  
**Impacto:** Penetraciones son punto debil frecuente en blindajes.

### MC-07: Blindaje Laminado (Multi-Material) con Interface Correction
**Estado:** PARCIAL (tenemos laminatedBarrier en mcginleyData.ts)  
**Descripcion:** Mejorar calculo de barreras laminadas con correccion por interface ( efecto de boundary entre materiales diferentes). Metodo de McGinley con validacion.  
**Referencia:** McGinley 2002 Ch. 7, Archer 1985  
**Impacto:** Barreras laminadas (Pb+concreto+placa) son comunes en instalaciones modernas.

### MC-08: Build-up Factor Mejorado — G-P Approximation
**Estado:** PARCIAL (tenemos buildup factor basico)  
**Descripcion:** Implementar aproximacion geometrica-progressiva (G-P) de Harima para buildup factors. Mas preciso que Taylor para energias >3 MeV.  
**Referencia:** Harima et al. Nucl Sci Eng 94:24, 1986  
**Impacto:** Mejora precision en blindaje de megavoltaje.

### MC-09: Base de Datos NIST de Materiales Completa
**Estado:** PARCIAL (tenemos nistMaterialLibrary.ts pero limitado)  
**Descripcion:** Ampliar a 100+ materiales con: composicion elemental, densidad, coeficientes de atenuacion (XCOM), energias de absorcion. Incluir materiales nuevos: composites, polimeros con cargas de W o Pb.  
**Referencia:** NIST XCOM, Hubbell & Seltzer 2004  
**Impacto:** Materiales no estandar son cada vez mas comunes.

### MC-10: Blindaje para Terapia con Protones y Iones Pesados
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Implementar metodologia para blindaje de salas de protonterapia y terapia con iones pesados (C-12). Incluye: pérdida de energia (Bethe-Bloch), cascadas hadronicas, activacion inducida.  
**Referencia:** NCRP 144, ICRP 116, Paganetti 2018  
**Impacto:** Protonterapia es el area de mas rapido crecimiento en radioterapia.

### MC-11: Blindaje para Radiofarmacos Terapeuticos (Y-90, Lu-177, Ac-225, Pb-212)
**Estado:** PARCIAL (tenemos TherapyDosimetry pero no shielding especifico)  
**Descripcion:** Calculador dedicado de blindaje para salas de preparacion y administracion de radiofarmacos terapeuticos. Incluye consideraciones de manejo de pacientes "vivo radiactivo".  
**Referencia:** ICRP 128, 140, AAPM TG 377, MIRD Pamphlet 26  
**Impacto:** Terapia radionuclidica es de alto crecimiento (Lutathera, Pluvicto).

### MC-12: Calculo de Dosis Ocupacional por Tarea
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Para cada tarea (instalacion fuente, paciente, QA), calcular dosis estimada al personal con diferentes configuraciones de blindaje movil.  
**Referencia:** ICRP 139, IAEA SSG-46  
**Impacto:** Requisito para programa de dosimetria ocupacional.

### MC-13: Decaimiento en Tiempo Real con Cadenas de Decaimiento
**Estado:** PARCIAL (tenemos BatemanDecay pero no cadenas)  
**Descripcion:** Extender Bateman para cadenas de decaimiento (Mo-99/Tc-99m, Ge-68/Ga-68, Sr-82/Rb-82, W-188/Re-188). Incluir generadores.  
**Referencia:** Nucleonica Decay Engine++, ICRP 107  
**Impacto:** Generadores son fuentes comunes en medicina nuclear.

### MC-14: Material Optimization Multi-Objetivo
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Algoritmo que optimice: minimizar costo, minimizar espesor, minimizar peso, maximizar atenuacion. No solo uno, sino frente de Pareto completo.  
**Referencia:** Multi-objective optimization, NSGA-II  
**Impacto:** Permite al usuario tomar decisiones informadas con trade-offs claros.

### MC-15: Correccion por Campo Disperso Angular (Scattering Angle)
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Implementar correccion por angulo de dispersion para scatter radiation. NCRP 147 asume 90 grados; el scatter real depende del angulo.  
**Referencia:** NCRP 147 Sec. 4.2.2, McGinley 2002 Fig. 3-5  
**Impacto:** Mejora precision para barreras no perpendiculares al haz.

---

# 3. INTERFAZ GRAFICA (UI/UX)

### UI-01: Comparacion Side-by-Side de Escenarios
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Permitir comparar dos escenarios de blindaje lado a lado con: diferencias resaltadas, delta de espesor, delta de costo, vista sincronizada del canvas.  
**Referencia:** RayStation plan comparison, MicroShield compare mode  
**Impacto:** Feature mas solicitada en revisiones de blindaje ("que pasa si...").

### UI-02: Sensitivity Analysis Visual — Sliders Interactivos
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Para cada parametro de entrada, slider que permite variar +/-50% y ver en tiempo real como cambia el resultado. Grafica de tornado integrada.  
**Referencia:** MicroShield sensitivity tool, professional engineering software  
**Impacto:** Analisis de sensibilidad es requisito en memoria de calculo profesional.

### UI-03: Vista 3D de la Instalacion
**Estado:** PARCIAL (tenemos doseMappingEngine.ts pero no visualizador 3D)  
**Descripcion:** Visualizacion 3D interactiva (WebGL/Three.js) de la sala con barreras, fuentes, y mapa de dosis volumetrico. Rotacion, zoom, cortes transversales.  
**Referencia:** Three.js, Babylon.js, Nucleonica 3D viewer  
**Impacto:** Visualizacion 3D mejora comprension de problemas complejos.

### UI-04: Plantillas de Instalaciones Pre-definidas
**Estado:** PARCIAL (tenemos bunkerLayouts.ts pero limitado)  
**Descripcion:** Biblioteca de 50+ plantillas: sala de RX convencional, mamografia, CT, sala de LINAC (Varian, Elekta), PET/CT, gammagrafia, braquiterapia, ciclotron, etc. Cargar con un click.  
**Referencia:** Nucleonica templates, MicroShield geometries  
**Impacto:** Reduce tiempo de setup de 30 min a 2 min.

### UI-05: Wizard Guiado para Memoria de Calculo
**Estado:** PARCIAL (tenemos MemoriaAIWizard pero no guiado paso a paso)  
**Descripcion:** Wizard de 10 pasos que guia al usuario a traves de todo el proceso: seleccion de instalacion, definicion de fuentes, calculo de barreras, verificacion, generacion de reporte. Con validacion en cada paso.  
**Referencia:** NCRP 147 workflow, AAPM TG 108 methodology  
**Impacto:** Reduce errores de usuarios novatos.

### UI-06: Dark Mode Profesional
**Estado:** PARCIAL (tenemos useDarkMode.ts pero no aplicado globalmente)  
**Descripcion:** Implementar dark mode completo en toda la aplicacion, no solo en canvas. Incluir temas: claro, oscuro, alto contraste (WCAG AAA), modo radiologo (fondo negro, lineas verdes).  
**Referencia:** shadcn/ui theming, Tailwind dark mode  
**Impacto:** Uso prolongado en salas oscuras (control de LINAC).

### UI-07: Keyboard Shortcuts Completos
**Estado:** PARCIAL (tenemos useCanvasKeyboardNav.ts pero limitado)  
**Descripcion:** Sistema completo de atajos de teclado: Ctrl+N (nuevo), Ctrl+S (guardar), Ctrl+Z/Y (undo/redo), F5 (calcular), F1 (ayuda), numeros 1-9 (herramientas), Tab (navegacion). Mostrar cheatsheet.  
**Referencia:** VS Code keybindings, Figma shortcuts  
**Impacto:** Productividad para usuarios avanzados.

### UI-08: Minimap Navegable del Canvas
**Estado:** PARCIAL (tenemos Minimap.tsx pero no integrado)  
**Descripcion:** Integrar minimap en la interfaz principal que muestre vista completa del layout con viewport actual resaltado. Click en minimap para navegar.  
**Referencia:** AutoCAD, Figma minimap  
**Impacto:** Navegacion rapida en instalaciones grandes.

### UI-09: Grid Snapping y Alignment Guides
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Implementar grid snapping (configurable: 1cm, 5cm, 10cm, 50cm) y alignment guides (smart guides) cuando se arrastran objetos, similar a Figma/Sketch.  
**Referencia:** Figma smart guides, AutoCAD snap  
**Impacto:** Layouts profesionales con precision milimetrica.

### UI-10: Historial de Versiones Visual
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Timeline visual que muestre todas las versiones del proyecto con: quien, cuando, que cambio, preview thumbnail. Permitir revertir a cualquier version.  
**Referencia:** Figma version history, Google Docs revision history  
**Impacto:** Colaboracion y recovery de cambios no deseados.

### UI-11: Annotations y Comentarios en Canvas
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Permitir agregar notas, comentarios y flechas directamente sobre el canvas. Visible en modo revision. Exportar con los comentarios.  
**Referencia:** Figma comments, AutoCAD markup  
**Impacto:** Peer review y colaboracion entre fisicos.

### UI-12: Modo Presentacion Full-Screen
**Estado:** PARCIAL (tenemos usePresentationMode.ts pero no integrado)  
**Descripcion:** Modo presentacion que muestre solo el canvas y resultados, sin toolbars ni menus. Ideal para reuniones con oncologos y arquitectos.  
**Referencia:** PowerPoint presentation mode, Figma presentation  
**Impacto:** Comunicacion con stakeholders no tecnicos.

### UI-13: Multi-idioma Completo (i18n)
**Estado:** PARCIAL (tenemos useI18n.tsx pero no traducciones completas)  
**Descripcion:** Implementar traducciones completas: espanol (Mexico), ingles, portugues (Brasil). Incluir terminologia tecnica apropiada para cada pais.  
**Referencia:** i18next, react-i18next  
**Impacto:** Mercado LATAM completo.

### UI-14: Onboarding Interactivo para Nuevos Usuarios
**Estado:** PARCIAL (tenemos OnboardingTour.tsx pero basico)  
**Descripcion:** Tour interactivo de 15 minutos que ensena: crear primer layout, agregar fuente, calcular blindaje, interpretar resultados, generar reporte. Con checkpoints y certificado de completitud.  
**Referencia:** User onboarding best practices  
**Impacto:** Reduce curva de aprendizaje y support tickets.

### UI-15: Dashboard Personalizable
**Estado:** PARCIAL (tenemos DashboardDialog.tsx)  
**Descripcion:** Dashboard principal con widgets arrastrables: KPIs de blindaje, graficas de dosis, lista de proyectos recientes, alertas regulatorias, feed de bibliografia.  
**Referencia:** Grafana, Tableau  
**Impacto:** Vista de 360 grados del programa de blindaje.

### UI-16: Vista Split-Screen (Canvas + Resultados)
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Permitir dividir pantalla: mitad canvas, mitad resultados/tablas. Arrastrable el divider.  
**Referencia:** VS Code split editor  
**Impacto:** Productividad en monitores grandes.

### UI-17: Exportacion a Formato Word con Memoria de Calculo
**Estado:** PARCIAL (tenemos usePDFGenerator.ts pero no Word)  
**Descripcion:** Generar documento Word (.docx) completo con: caratula, indice, introduccion, metodologia, calculos paso a paso, tablas, figuras, conclusiones, anexos, referencias. Formato CNSNS.  
**Referencia:** NOM-040 formato de memoria de calculo  
**Impacto:** Requisito regulatorio; CNSNS acepta Word o PDF.

### UI-18: Exportacion a Excel con Data Tables
**Estado:** PARCIAL (tenemos useExcelExport.ts pero no integrado en todos los modulos)  
**Descripcion:** Exportar todas las tablas de datos a Excel: barreras, fuentes, dosis, materiales, comparativas. Con formato profesional y formulas.  
**Referencia:** Professional engineering deliverables  
**Impacto:** Permite analisis posterior y graficas personalizadas.

---

# 4. APIs WEB Y TECNOLOGIAS

### API-01: WebGPU Compute Shaders para Monte Carlo
**Estado:** PARCIAL (tenemos useWebGPU.ts y useWebGPUHeatmap.ts pero no integrado en motor MC)  
**Descripcion:** Usar WebGPU para acelerar simulaciones Monte Carlo en el navegador. 100-1000x mas rapido que JavaScript puro para ray tracing.  
**Referencia:** WebGPU spec, compute shaders  
**Impacto:** Monte Carlo interactivo en tiempo real.

### API-02: WebTransport para Streaming de Datos
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Para colaboracion en tiempo real, usar WebTransport (HTTP/3) en vez de WebSocket. Menor latencia, mejor manejo de congestion.  
**Referencia:** WebTransport API  
**Impacto:** Colaboracion fluida entre multiples usuarios.

### API-03: WebCodecs para Video Export de Simulaciones
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Exportar simulaciones Monte Carlo como video MP4/H.264 usando WebCodecs API. Con frame encoding en hardware.  
**Referencia:** WebCodecs API  
**Impacto:** Presentaciones profesionales con animaciones.

### API-04: Sensor APIs para Dispositivos Moviles
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Usar: AmbientLightSensor para ajustar brillo, Accelerometer para rotar vista 3D, Geolocation para datos de ubicacion en reporte.  
**Referencia:** Generic Sensor API  
**Impacto:** Experiencia mejorada en tablets de campo.

### API-05: Web Serial API para Conexion con Detectores
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Permitir conectar detectores de radiacion directamente via USB serial (Arduino, Raspberry Pi, detectores comerciales) para mediciones en campo.  
**Referencia:** Web Serial API  
**Impacto:** Mediciones directas integradas en el flujo de trabajo.

### API-06: Web Bluetooth API para Wearables Dosimetricos
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Conectar dosimetros personales via Bluetooth para lectura automatica de dosis acumulada.  
**Referencia:** Web Bluetooth API  
**Impacto:** Integracion con programas de dosimetria.

### API-07: WebHID API para Perifericos Especializados
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Soporte para: SpaceMouse (3Dconnexion) para navegacion 3D, tablets de dibujo para sketch en canvas, foot pedals para shortcuts.  
**Referencia:** WebHID API  
**Impacto:** Productividad con hardware especializado.

### API-08: Push API para Alertas Regulatorias
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Notificaciones push cuando: se publican nuevas NOMs, vencen certificaciones, hay actualizaciones criticas de seguridad.  
**Referencia:** Push API, Notifications API  
**Impacto:** Compliance automatico sin verificacion manual.

### API-09: Payment Request API para Modulo Comercial
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Si se comercializa, integrar Payment Request API para suscripciones, modulo premium, o consultoria online.  
**Referencia:** Payment Request API  
**Impacto:** Monetizacion.

### API-10: Credential Management API para Login
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Permitir login con: Google, Microsoft (para instituciones), FedCM (Federated Credential Management), passkeys (WebAuthn).  
**Referencia:** Credential Management API, WebAuthn  
**Impacto:** SSO para hospitales e instituciones.

---

# 5. INGENIERIA DE SOFTWARE

### IS-01: TypeScript Strict Mode
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Activar strict: true en tsconfig.json. Actualmente probablemente hay muchos any implicitos. Requiere refactor significativo pero elimina bugs de tipo en runtime.  
**Referencia:** TypeScript best practices  
**Impacto:** Elimina clase completa de bugs. Mejora autocompletion.

### IS-02: Coverage de Tests >80%
**Estado:** NO IMPLEMENTADO (solo 4 archivos de test)  
**Descripcion:** Actual: ~4 test files. Objetivo: 80% coverage. Priorizar: shieldingMath.ts, shieldingEngine.ts, engine/*.ts. Usar vitest + @vitest/coverage-v8.  
**Referencia:** Industry standard  
**Impacto:** Confianza en refactorings y nuevos features.

### IS-03: E2E Tests con Playwright
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Tests end-to-end que: abran la app, creen un layout, calculen blindaje, verifiquen resultado, exporten PDF. Correr en CI.  
**Referencia:** Playwright, Cypress  
**Impacto:** Detecta regressions en flujos completos.

### IS-04: Split de ShieldingDesigner.tsx (1761 lineas)
**Estado:** PARCIAL (ya lazy-load 172 dialogs)  
**Descripcion:** ShieldingDesigner.tsx tiene 1761+ lineas y 219 hooks. Separar en: LayoutManager, CalculationController, ToolbarController, StateManager.  
**Referencia:** React best practices  
**Impacto:** Mantenibilidad. Actualmente es dificil de entender y modificar.

### IS-05: State Management con Zustand
**Estado:** NO IMPLEMENTADO (usa useState + props drilling)  
**Descripcion:** Migrar estado global a Zustand. Elimina props drilling y re-renders innecesarios. 76K lineas de codigo con useState es dificil de mantener.  
**Referencia:** Zustand, Redux Toolkit  
**Impacto:** Performance y mantenibilidad.

### IS-06: React Query para Datos Remotos
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Si se agregan datos remotos (catalogo de equipos, actualizaciones regulatorias), usar React Query (TanStack Query) para caching y sincronizacion.  
**Referencia:** TanStack Query  
**Impacto:** Datos siempre frescos sin re-fetches innecesarios.

### IS-07: Monorepo con Nx o Turborepo
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Separar en: app, shared-lib, test-suite, docs. Permite CI paralelo y mejor organizacion.  
**Referencia:** Nx, Turborepo  
**Impacto:** Escalabilidad para equipo de desarrollo.

### IS-08: Storybook para Componentes UI
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Documentar todos los componentes UI en Storybook. Facilita desarrollo aislado y testing visual.  
**Referencia:** Storybook  
**Impacto:** Desarrollo UI mas rapido y consistente.

### IS-09: Lighthouse CI en Pipeline
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Integrar Lighthouse CI en GitHub Actions. Asegurar scores >90 en performance, accessibility, best practices, SEO.  
**Referencia:** Lighthouse CI  
**Impacto:** Performance y accesibilidad no se degradan.

### IS-10: Dependabot y Security Scanning
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Activar Dependabot para actualizaciones automaticas de dependencias. Integrar npm audit y Snyk en CI.  
**Referencia:** GitHub security features  
**Impacto:** Seguridad proactiva.

### IS-11: Feature Flags para Despliegue Gradual
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Implementar feature flags (LaunchDarkly o simple config) para activar features gradualmente sin redeploy.  
**Referencia:** Feature flags pattern  
**Impacto:** Despliegue continuo sin riesgo.

### IS-12: Analytics de Uso (Anonimo)
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Trackear anonimamente: features mas usadas, tiempo por tarea, errores comunes. Con opt-in y GDPR compliant.  
**Referencia:** Plausible Analytics, PostHog  
**Impacto:** Data-driven prioritizacion de features.

### IS-13: Performance Budget en CI
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Establecer limites: main bundle <350KB gzip, FCP <1.5s, TTI <3.5s. Fallar CI si se exceden.  
**Referencia:** Performance budgets  
**Impacto:** Performance no se degrada con nuevos features.

### IS-14: Bundle Analyzer y Tree Shaking Audit
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Ejecutar rollup-plugin-visualizer en cada build. Identificar dependencias grandes no usadas. Revisar tree shaking.  
**Referencia:** rollup-plugin-visualizer  
**Impacto:** Bundle size optimizado.

---

# 6. DOCUMENTACION Y REGULATORIO

### DOC-01: Manual de Usuario Interactivo (Video + Texto)
**Estado:** PARCIAL (tenemos manual HTML basico)  
**Descripcion:** Manual completo con: videos tutoriales embebidos, screenshots interactivos, busqueda full-text, ejemplos paso a paso con datos reales.  
**Referencia:** Stripe docs, Vercel docs  
**Impacto:** Reduce curva de aprendizaje.

### DOC-02: Ejemplos Validados Worked Examples
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Implementar 20 worked examples completos con: enunciado, datos, calculo manual paso a paso, resultado en app, comparacion.  
**Referencia:** NCRP 147 examples, BIR 2012 examples, IAEA training material  
**Impacto:** Validacion implicita del software.

### DOC-03: Formato de Reporte CNSNS Digital
**Estado:** PARCIAL (tenemos CNSNSAutoReportDialog pero no formato oficial)  
**Descripcion:** Implementar formato exacto de memoria de calculo que acepta CNSNS digitalmente. Incluye todos los campos requeridos, firmas digitales, sellos.  
**Referencia:** CNSNS formato oficial de memoria de calculo  
**Impacto:** Aceptacion directa por CNSNS sin rechazos por formato.

### DOC-04: Guia de Validacion para Fisicos Medicos
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Documento que guie al fisico medico en como validar la aplicacion para uso clinico: que test correr, que comparar, que documentar.  
**Referencia:** AAPM TG 1008 (software validation)  
**Impacto:** Requisito para uso clinico regulatorio.

### DOC-05: White Paper Tecnico de Validacion
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Documento cientifico (PDF) con: metodologia de validacion, resultados de comparacion, incertidumbres, limitaciones, declaracion de conformidad.  
**Referencia:** ISO 13485 (medical device software)  
**Impacto:** Credibilidad profesional y regulatoria.

### DOC-06: Changelog Automatizado
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Generar CHANGELOG.md automaticamente desde commits (conventional commits). Incluir: features, fixes, breaking changes, migraciones.  
**Referencia:** Keep a Changelog, conventional commits  
**Impacto:** Transparencia para usuarios.

### DOC-07: API Documentation (JSDoc)
**Estado:** PARCIAL  
**Descripcion:** Documentar TODAS las funciones publicas con JSDoc: parametros, retorno, excepciones, ejemplos. Generar docs estaticos.  
**Referencia:** JSDoc, TypeDoc  
**Impacto:** Facilita contribuciones y debugging.

### DOC-08: Guia de Contribucion (Open Source)
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Si se open-sourcea: CONTRIBUTING.md, CODE_OF_CONDUCT.md, issue templates, PR templates, guia de setup para desarrolladores.  
**Referencia:** GitHub community guidelines  
**Impacto:** Comunidad de contribuidores.

---

# 7. COMPARATIVA CON HERRAMIENTAS PROFESIONALES

### HP-01: MicroShield Pro — Feature Parity
**Estado:** PARCIAL  
**Features faltantes:**
- 16 geometrias diferentes (solo tenemos barrera plana)
- Source inference tool (dosis → actividad)
- Decay heat calculator
- Material and nuclear data viewer con 1500+ nuclidos
- Batch tool para calculos multiples
- Sensitivity tool
- Export a Word y Excel

**Referencia:** MicroShield Pro feature list  
**Impacto:** MicroShield es el standard de industria.

### HP-02: Nucleonica — Feature Parity
**Estado:** PARCIAL  
**Features faltantes:**
- Decay Engine++ con cadenas completas (Mo-99/Tc-99m, etc.)
- 1500+ nuclidos en base de datos
- H*(10) dosimetria y shielding con 4 modos
- Cloud-based con colaboracion en tiempo real
- API REST para integracion
- Historial de calculos completo

**Referencia:** Nucleonica.com  
**Impacto:** Nucleonica es lider en Europa.

### HP-03: e-Ship++ (Nucleonica) — Transporte
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Calculo de blindaje para transporte de materiales radiactivos: Type A/B packages, DOT 7A, ADR. Dosis en superficie y a 1m y 2m.  
**Referencia:** IAEA SSR-6, 10 CFR 71  
**Impacto:** Mercado de logistica nuclear.

### HP-04: Phy-X/PSD — Material Properties
**Estado:** PARCIAL (tenemos phyXData.ts pero no calculador)  
**Descripcion:** Integrar calculador de propiedades de blindaje: MAC, HVL, TVL, MFP, Zeff, EBF, EABF para cualquier material personalizado.  
**Referencia:** phy-x.net/PSD  
**Impacto:** Permite evaluar materiales no estandar.

### HP-05: MCNP/Geant4 Input Generator Mejorado
**Estado:** PARCIAL (tenemos monteCarloEngine.ts basico)  
**Descripcion:** Generar inputs completos para MCNP6, Geant4, FLUKA, PENELOPE con: geometria del layout, fuentes definidas, tallies configurados, variance reduction.  
**Referencia:** MCNP6 manual, Geant4 User's Guide  
**Impacto:** Bridge entre calculo rapido y simulacion precisa.

### HP-06: Mosaic Atomics — Collaboration
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Features de colaboracion: comentarios en barreras, revision por pares, aprobaciones con firma digital, versionado de proyectos.  
**Referencia:** mosaicatomics.com  
**Impacto:** Workflows de equipo multidisciplinario.

### HP-07: RadCalculator (Phil Rutherford) — Portabilidad
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Version mobile-first (PWA) que funcione offline completamente. Optimizado para tablet en campo.  
**Referencia:** Mobile shielding calculators  
**Impacto:** Uso en campo durante inspecciones.

### HP-08: IAEA RASA — Contenido Educativo
**Estado:** PARCIAL (tenemos manual HTML)  
**Descripcion:** Modulo educativo con: lectures interactivas, ejercicios practicos, examen de certificacion, creditos CME/CPD.  
**Referencia:** IAEA RASA training material  
**Impacto:** Educacion continua para fisicos medicos.

### HP-09: RayStation/Eclipse — TPS Integration
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Integracion con TPS comerciales: importar plan de tratamiento (DICOM RT), calcular blindaje basado en campos reales del plan.  
**Referencia:** DICOM RT, HL7 FHIR  
**Impacto:** Blindaje basado en datos reales de tratamiento.

### HP-10: SPAR (Shielding Program for Acelerators and Reactors)
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Metodologia para blindaje de aceleradores de alta energia: cascadas electromagneticas, cascadas hadronicas, activacion, skyshine de aceleradores.  
**Referencia:** NCRP 144, IAEA SSG-8  
**Impacto:** Mercado de investigacion nuclear.

### HP-11: VARSKIN — Dosis Cutanea
**Estado:** NO IMPLEMENTADO  
**Descripcion:** Calculo de dosis a piel de contaminacion superficial y hot particles. Modelo de punto, disco, cilindro, esfera, capa.  
**Referencia:** VARSKIN 6, NRC NUREG/CR-6918  
**Impacto:** Dosimetria ocupacional y respuesta a emergencias.

---

# RESUMEN DE PRIORIDADES

## Inmediata (Proxima Semana)
1. VV-01: Validacion contra tablas NCRP 147
2. VV-03: Scatter fraction por modelo de CT
3. MC-01: AAPM TG 108 PET shielding completo
4. UI-01: Comparacion side-by-side de escenarios
5. UI-11: Annotations y comentarios en canvas

## Corto Plazo (Proximo Mes)
6. VV-02: Benchmark contra XRAYBARR
7. VV-10: Incertidumbre GUM integrada
8. VV-11: Sensitivity analysis (tornado diagrams)
9. MC-02: IPEM Report 109 SPECT
10. MC-11: Blindaje radiofarmacos terapeuticos
11. UI-02: Sliders interactivos de sensibilidad
12. UI-04: Plantillas de instalaciones (50+)
13. UI-05: Wizard guiado para memoria
14. UI-18: Exportacion a Excel profesional

## Mediano Plazo (Proximos 3 Meses)
15. VV-04 a VV-09: Tests de validacion restantes
16. MC-03 a MC-15: Motores de calculo
17. UI-03, UI-06 a UI-17: Mejoras UI
18. API-01 a API-10: APIs web
19. IS-01 a IS-14: Ingenieria de software
20. HP-01 a HP-11: Parity con herramientas profesionales

---

*Documento generado el 2025-06-03. Total: 88 recomendaciones en 7 categorias.*
