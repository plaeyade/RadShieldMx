# RadShield-MX — Status & Backlog
# Version: v52 | Updated: 2026-06-05

## ✅ AUDITORIA CRITICA — 3 Recomendaciones Implementadas

### 1. State Management — Zustand ✅
- **Archivos creados:**
  - `src/stores/appStore.ts` — Store unificado (dialogs + canvas + calculation)
  - `src/stores/dialogStore.ts` — Store de diálogos (80+ nombres)
  - `src/stores/canvasStore.ts` — Store del canvas (floorPlan, tools, zoom, undo/redo)
  - `src/stores/calculationStore.ts` — Store de cálculos (results, MC jobs, validation)
- **Hook:** `src/hooks/useDialogHandlers.ts` — 120+ handlers centralizados
- **Impacto:** Elimina props drilling de ~120 callbacks en Toolbar

### 2. ShieldingDesigner.tsx — Decomposicion ✅
- **Archivos creados:**
  - `src/sections/controllers/DialogImports.ts` — 160+ lazy imports centralizados
  - `src/hooks/useDialogHandlers.ts` — Hook con todos los handlers
- **Imports agregados a ShieldingDesigner.tsx:**
  - `useAppStore`, `useDialog` from `@/stores/appStore`
  - `useDialogHandlers` from `@/hooks/useDialogHandlers`
- **Reduccion:** ~160 lineas de imports extraidos a DialogImports.ts
- **Estado:** Decomposicion gradual — stores disponibles, Toolbar puede migrar progresivamente

### 3. Referencia Bibliografica Inconsistente ✅
- **Conteo real:** 82 referencias (verificado con `grep -c "id:" src/lib/bibliography.ts`)
- **SplashScreen corregido:** Muestra "82 referencias" (era 113 incorrectamente)

---

## 📚 Literatura Pendiente por Vectorizar (v70)

### Prioridad ALTA (antes v60)
| # | Documento | Estado |
|---|-----------|--------|
| 1 | NCRP Report No. 49 (1976) | PENDIENTE |
| 2 | NCRP Report No. 144 (2003) | PENDIENTE |
| 3 | AAPM TG 246 | PENDIENTE |
| 4 | IAEA SSG-46 | PENDIENTE |
| 5 | IPEM Report 75 | PENDIENTE |
| 6 | ICRP Publication 33 | PENDIENTE |
| 7 | NOM-013-NUCL-2009 (egreso de pacientes; ficha en src/lib/normativaMx.ts) | PENDIENTE |
| 8 | NOM-021-ENER | PENDIENTE |

### Prioridad MEDIA (v60-v70)
| # | Documento | Estado |
|---|-----------|--------|
| 9 | McGinley 2nd Ed | PENDIENTE |
| 10 | AAPM TG 96 | PENDIENTE |
| 11-22 | (ver lista completa en version anterior) | PENDIENTE |

---

## 🧠 Capas AI Implementadas (v52)
| Capa | Nombre | Estado |
|------|--------|--------|
| 1 | LLM Integration (OpenAI/Ollama/LMStudio) | ✅ |
| 2 | RAG (50+ chunks NCRP 151/147/IAEA 47) | ✅ |
| 3 | ML Predictivo (TensorFlow.js neural network) | ✅ |
| 4 | Computer Vision (Canny + Hough planos) | ✅ |
| 5 | Agentes Autonomos (Design + Validation + Cost) | ✅ |

---

> **Recordatorio v70:** Al llegar a la version 70, vectorizar los 22 documentos pendientes para alcanzar 500+ chunks en la base de datos.
