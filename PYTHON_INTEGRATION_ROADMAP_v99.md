# Python Integration Roadmap v99 — RadShield-MX
## Analisis de contribuciones Python, Revit BIM, ML Training y Fuentes de Datos

---

## 1. Que mas puede aportar Python a RadShield-MX?

### 1.1 Simulacion Monte Carlo (Gold Standard)

Python puede integrar los codigos Monte Carlo que son el estandar de oro en calculos de blindaje, permitiendo validacion de los resultados NCRP/IAEA:

| Codigo | Lenguaje base | Python binding | Uso en RadShield-MX |
|--------|--------------|----------------|---------------------|
| **Geant4** | C++ | **g4py** (oficial) | Transporte particulas, blindaje complejo, protones |
| **TOPAS** | C++ | **TOPAS Python API** | Protonterapia, simulacion clinica simplificada |
| **EGSnrc** | C/C++ | **egs-python** | Electron/foton, dosis externa, blindaje diagnostico |
| **FLUKA** | Fortran/C | **fluka-python** | Iones pesados, terapia hadronica, blindaje espacial |
| **MCNP** | Fortran | **mcnp-py** (NPS) | Neutrones, blindaje nuclear, criticidad |
| **GATE** | C++ | **opengate** (Python nativo) | PET/SPECT, imagen molecular, dosimetria interna |

**Implementacion recomendada**: Microservicio Docker con Geant4/TOPAS que recibe parametros JSON desde tRPC y devuelve dosis simulada. ONNX para inferencia rapida en produccion.

### 1.2 Procesamiento DICOM y QA (PyMedPhys + pylinac)

```python
# Ejemplo: Analisis gamma con PyMedPhys
import pymedphys

gamma = pymedphys.gamma(
    axes_reference, dose_reference,
    axes_evaluation, dose_evaluation,
    dose_percent_threshold=2,    # 2% criterio clinico
    distance_mm_threshold=2,      # 2mm DTA
    local_gamma=True
)
```

| Libreria | Funcion | Aplicacion en RadShield-MX |
|----------|---------|---------------------------|
| **pydicom** | Lectura/escritura DICOM | Importar estructuras RTSTRUCT del TPS para blindaje 3D |
| **pylinac** | QA acelerador (TG-51, TG-142) | Validar modelos de haz para calculos de scatter |
| **pymedphys** | Gamma index, DICOM, Mosaiq | Comparar distribuciones de dosis, validar calculos |
| **dicompyler** | Visualizacion DICOM | Renderizar estructuras de paciente en el canvas |

### 1.3 Bases de Datos Cientificas (NIST XCOM)

```python
# Ejemplo: Coeficiente de atenuacion lineal con NIST XCOM
from xcom_python import XCOM  # wrapper no oficial

xcom = XCOM()
mu = xcom.get_attenuation(
    element='Pb',           # Plomo
    energy_MeV=0.5,         # 500 keV
    density=11.34           # g/cm3
)
# mu = 16.8 cm^-1 (valor NIST)
```

**NIST XCOM**: Base de datos primaria de secciones efficaces de fotones (1 keV - 100 GeV) para todos los elementos Z<=100. Usada en papers recientes (2026) para entrenamiento ML con R²>0.97.

### 1.4 Computacion Cientifica Avanzada

| Libreria | Funcion | Caso de uso |
|----------|---------|-------------|
| **SciPy.optimize** | Minimizacion multivariable | Optimizacion de costo de blindaje con restricciones de dosis |
| **NumPy/Pandas** | Algebra lineal, dataframes | Preprocesamiento de datos Monte Carlo |
| **Matplotlib/Plotly** | Visualizacion avanzada | Graficas de barras tornado, mapas de dosis 3D |
| **scikit-learn** | ML clasico (SVM, RF, KNN) | **Recomendado** para problemas tabulares de blindaje |
| **PyTorch/JAX** | ML profundo, diferenciacion automatica | Optimizacion de espesores por gradiente descendiente |

---

## 2. Integracion con Autodesk Revit

### 2.1 Arquitectura de Integracion

Revit no permite JavaScript directamente. La integracion requiere una capa intermedia:

```
RadShield-MX (TypeScript/React)
         |
         v
    API REST (tRPC)  <---------
         |                     |
         v                     |
  Backend Python/Node          |
         |                     |
         v                     |
   Revit Add-in (C#)           |
   Autodesk Revit API          |
         |                     |
         v                     |
   Modelo BIM .rvt <-----------
```

### 2.2 Revit Add-in (C# .NET)

El add-in se desarrolla en C# usando Autodesk Revit API:

```csharp
// Ejemplo: Crear barrera de blindaje como FamilyInstance
public Result Execute(ExternalCommandData commandData, ref string message, ElementSet elements)
{
    UIApplication uiapp = commandData.Application;
    UIDocument uidoc = uiapp.ActiveUIDocument;
    Document doc = uidoc.Document;
    
    // Crear muro de blindaje
    WallType wallType = new FilteredElementCollector(doc)
        .OfClass(typeof(WallType))
        .Cast<WallType>()
        .FirstOrDefault(w => w.Name.Contains("Concrete"));
    
    // Parametros compartidos para blindaje
    Parameter paramThickness = wall.get_Parameter(BuiltInParameter.WALL_ATTR_WIDTH_PARAM);
    paramThickness.Set(UnitUtils.ConvertToInternalUnits(235, DisplayUnitType.DUT_MILLIMETERS));
    
    // Metadatos de blindaje
    wall.LookupParameter("RS_ShieldingType").Set("NCRP-151-Primary");
    wall.LookupParameter("RS_DesignGoal_mSv").Set(0.02);
    wall.LookupParameter("RS_MaterialCode").Set("CONCRETE235");
    
    return Result.Succeeded;
}
```

### 2.3 Flujo de Trabajo Revit <-> RadShield-MX

| Paso | Direccion | Accion |
|------|-----------|--------|
| 1 | Revit → RadShield | Exportar geometria de habitaciones (muros, puertas, ventanas) como JSON/IFC |
| 2 | RadShield | Importar geometria, detectar barreras automaticamente (OpenCV) |
| 3 | RadShield | Calcular blindaje NCRP 147/151 para cada barrera |
| 4 | RadShield → Revit | Enviar espesores de blindaje como parametros compartidos |
| 5 | Revit | Generar muros con espesor calculado + parametros de blindaje |
| 6 | Revit | Schedule de blindaje con tabla de materiales y espesores |

### 2.4 Parametros Compartidos (Shared Parameters)

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| RS_ShieldingType | Texto | Primaria/Secundaria/Leakage/Scatter |
| RS_DesignGoal_mSv | Numero | Meta de dosis P (mSv/semana) |
| RS_MaterialCode | Texto | CONCRETE235, LEAD, STEEL, etc. |
| RS_RequiredThickness_mm | Numero | Espesor calculado (mm) |
| RS_ActualThickness_mm | Numero | Espesor actual en modelo (mm) |
| RS_PassFail | Texto | PASS/FAIL segun cumplimiento |
| RS_NCRPReference | Texto | Referencia NCRP aplicada |

### 2.5 Implementacion Recomendada

1. **Fase 1**: Revit Add-in C# que exporta geometria a JSON/IFC
2. **Fase 2**: Endpoint tRPC en RadShield que importa IFC y genera barreras
3. **Fase 3**: Bidireccional — RadShield calcula y envia espesores a Revit via REST
4. **Fase 4**: Plugin Revit visualiza isodosis 3D sobre el modelo BIM

---

## 3. Como se Entrenan los Modelos ML

### 3.1 Pipeline de Entrenamiento (basado en literatura 2024-2026)

Los papers recientes (IntechOpen 2026, PMC 2025) usan este flujo:

```
Fase 1: Generacion de Datos (Monte Carlo)
         MCNPX/TOPAS/Geant4 simula configuraciones de blindaje
         → Dataset: (actividad, energia, espesor, material) → (dosis, transmission)
         
Fase 2: Preprocesamiento
         Normalizacion (StandardScaler)
         Feature engineering: Z_eff, densidad_e, energia, composicion
         Train/Validation/Test split (80/10/10)
         
Fase 3: Entrenamiento
         Modelo: scikit-learn (SVR, RF) o PyTorch (ANN)
         Optimizador: Levenberg-Marquardt (papers) o Adam (PyTorch)
         Metricas: MAE, RMSE, R²
         
Fase 4: Validacion
         Cross-validation k-fold (k=5)
         Test con datos "unknown" fuera del rango de entrenamiento
         Error < 2% vs Monte Carlo (umbral aceptado en literatura)
         
Fase 5: Exportacion
         ONNX: torch.onnx.export() o skl2onnx
         Despliegue: onnxruntime-node en tRPC
```

### 3.2 Topologia de Red Recomendada

Basado en papers 2024-2026 con error < 1-2%:

```python
# Modelo PyTorch — ANN para prediccion de espesor de blindaje
import torch.nn as nn

class ShieldingPredictor(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Sequential(
            nn.Linear(6, 64),    # input: [E_MeV, A_GBq, d_m, T_occ, U_use, rho]
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 1)     # output: espesor_mm
        )
    
    def forward(self, x):
        return self.fc(x)
```

**Arquitectura validada**: [6 → 64 → 32 → 16 → 1] con ReLU, Levenberg-Marquardt, MSE loss.

### 3.3 Metricas de Validacion

| Metrica | Valor objetivo | Fuente |
|---------|---------------|--------|
| MAE | < 1% del valor Monte Carlo | PMC 2025 (gamma shielding ANN) |
| R² | > 0.97 | IntechOpen 2026 (XCOM ML) |
| Error datos "unknown" | < 2% | PMC 2025 (MCNPX vs ANN) |
| Tiempo inferencia | < 500 ms (CPU) | ONNX Runtime benchmark |

---

## 4. De donde se obtienen los datos para entrenar

### 4.1 Fuentes Primarias de Datos

#### A. NIST XCOM Database (gratuita, programmatica)
```
URL: https://physics.nist.gov/cgi-bin/Xcom/xcom3_1
Datos: Coeficientes de atenuacion masica μ/ρ para Z=1-100
Energia: 1 keV — 100 GeV
Python: xcom-python (wrapper no oficial) o web scraping
Papers: IntechOpen 2026 usa XCOM para entrenar SVR con R²=0.9885
```

#### B. NCRP Report Tables (publicaciones oficiales)
| Tabla | Contenido | Uso ML |
|-------|-----------|--------|
| NCRP 147 Table A.2 | TVL diagnostico (Pb, Concrete, Steel, Gypsum) | Dataset TVL vs kVp |
| NCRP 147 Table A.3 | Scatter fractions | Dataset scatter fraction vs angle |
| NCRP 147 Eq. 4.1 | Archer transmission B = (1 + β/α)^(-αx) | Validacion transmission |
| NCRP 151 Table B.1-B.6 | TVL MV (primary, scatter, leakage) | Dataset TVL vs MV |
| NCRP 151 Table B.7 | Neutron TVL (concrete, polyethylene, steel) | Dataset neutron TVL |

#### C. Simulaciones Monte Carlo (generacion de datos sinteticos)

```python
# Ejemplo: Generar dataset con MCNP via Python
import subprocess
import numpy as np

# Parametros a variar
activities = np.linspace(1, 1000, 50)    # 1-1000 GBq
energies = [0.1, 0.5, 1.0, 5.0, 10.0]   # MeV
materials = ['CONCRETE', 'LEAD', 'STEEL']
thicknesses = np.linspace(10, 500, 50)   # mm

# Grid search: 50 × 5 × 3 × 50 = 37,500 simulaciones
dataset = []
for A in activities:
    for E in energies:
        for mat in materials:
            for t in thicknesses:
                # Ejecutar MCNP con esta configuracion
                dose = run_mcnp(A, E, mat, t)
                dataset.append({
                    'activity_GBq': A, 'energy_MeV': E,
                    'material': mat, 'thickness_mm': t,
                    'dose_mSv_per_wk': dose
                })
```

### 4.2 Estrategia de Recoleccion de Datos para RadShield-MX

#### Fase 1: Datos Tabulados (inmediato)
1. **Transcribir tablas NCRP 147/151** → CSV con todas las combinaciones energía-material-TVL
2. **Scraping NIST XCOM** → Dataset μ(E, Z) para 100 elementos
3. **Resultados Monte Carlo publicados** → Papers con datasets disponibles (PMC, arXiv)

#### Fase 2: Datos Sinteticos (semanas)
4. **Geant4/TOPAS batch** → 10,000+ simulaciones variando (E, A, d, material, espesor)
5. **MCNP para neutrones** → Dataset especifico blindaje neutronico

#### Fase 3: Datos Reales (meses)
6. **Mediciones clinicas** → Comparar predicciones vs mediciones dosimetricas reales
7. **Feedback loop** → Usar calculos validados del usuario como datos de entrenamiento

### 4.3 Dataset Especifico para Cada Modulo

| Modulo ML | Features (input) | Target (output) | Fuente de datos |
|-----------|-----------------|-----------------|-----------------|
| **Espesor óptimo** | [E_MeV, A_GBq, d_m, T_occ, U_use, material_Zeff] | espesor_mm | NCRP tables + MC sims |
| **Material óptimo** | [E_MeV, P_mSv, d_m, costo_$, peso_kg] | mejor_material | Cost DB + MC sims |
| **Categoría transporte** | [A_GBq, E_MeV, nuclido, distancia_m] | Cat_I/II/III | SSR-6 tables + formula |
| **Skyshine** | [E_MeV, altura_m, angulo_deg, area_cm2] | dosis_nSv | NCRP 151 Sec. 5.4 + MC |
| **Dosis ambiental** | [x_m, y_m, fuentes[], barreras[]] | kerma_mSv/wk | Spatial MC sims |

---

## 5. Roadmap de Implementacion Python (v100-v110)

### v100: NIST XCOM + PyMedPhys Integration
- Script Python para descargar y cachear datos XCOM
- Tabla de atenuacion interactiva en RadShield-MX
- Comparacion gamma index para validacion de calculos

### v101: scikit-learn → ONNX Pipeline
- Notebook de entrenamiento RandomForest para espesores
- Export ONNX, endpoint tRPC con onnxruntime-node
- Boton "Predecir Espesor" en editor de barreras

### v102: Revit IFC Import
- Exportar geometria Revit → IFC
- Parser IFC en TypeScript para generar barreras
- Mapeo de muros Revit → objetos Barrier

### v103: Geant4 Docker Microservice
- Contenedor Docker con Geant4 precompilado
- API REST: JSON in → dosis simulada out
- Validacion de resultados NCRP con MC gold standard

### v104: Revit Add-in C# (bidireccional)
- Add-in Revit con parametros compartidos RS_*
- Importar espesores calculados desde RadShield
- Schedule de blindaje en Revit

### v105-v110: ML Avanzado
- PyTorch para optimizacion de blindajes multi-objetivo
- JAX para diferenciacion automatica en calculos inversos
- Dataset feedback loop con datos clinicos

---

## Referencias

1. Ickecan et al. (2026). Prediction of Gamma Radiation Shielding Properties Using ML. IntechOpen. DOI:10.5772/intechopen.1015114
2. PMC (2025). Artificial Neural Network for Optimizing Gamma Radiation Shielding. PMC12686668.
3. Chen et al. (2025). ML-Based Design and MC Simulation of Neutron Beam Shutter. arXiv:2504.17319.
4. G4-Med (2020). Report on Geant4 benchmarking for medical physics. Med Phys 48(1):19-56.
5. NIST XCOM: https://physics.nist.gov/cgi-bin/Xcom/xcom3_1
6. PyMedPhys: https://docs.pymedphys.com
7. TOPAS: https://topasmc.org
8. NCRP 147 (2004). Structural Shielding Design for Medical X-Ray Imaging Facilities.
9. NCRP 151 (2005). Structural Shielding Design and Evaluation for Megavoltage X- and Gamma-Ray Radiotherapy Facilities.
10. IAEA SSR-6 Rev.1 (2018). Regulations for the Safe Transport of Radioactive Material.

---

*Documento generado el 2026-06-08*
*Version: v99*
*Para RadShield-MX — Professional Radiation Shielding Design*
