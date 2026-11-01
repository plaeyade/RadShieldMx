# Plan de Migracion Zustand — Minimizando Riesgo
# RadShield-MX v52 → v60

## Principio: "Strangler Fig Pattern"
Migrar gradualmente sin tocar lo que funciona. Los useState legacy coexisten con Zustand hasta que cada estado se migra y se prueba.

## Timeline

### Fase 0: ✅ COMPLETADA (v52)
- [x] Crear 4 stores (app, dialog, canvas, calculation)
- [x] Crear DialogImports.ts (160 lazy imports)
- [x] Crear useDialogHandlers.ts (120 callbacks)
- [x] Agregar imports a ShieldingDesigner.tsx
- [x] Verificar build pasa

### Fase 1: Dialogos menos criticos (v53) — RIESGO: BAJO
- Migrar 10-15 dialogs de la cola (los menos usados)
- Patron: crear wrapper que lee del store, fallback a useState
- Si falla, el fallback mantiene funcionando
- Tiempo estimado: 1 sesion

### Fase 2: Dialogos principales + Toolbar (v54) — RIESGO: MEDIO
- Migrar los 20 dialogs mas usados
- Toolbar recibe handlers del store en vez de props
- Prueba manual de cada menu
- Tiempo estimado: 1-2 sesiones

### Fase 3: Estado de calculo + Canvas (v55) — RIESGO: MEDIO
- Migrar floorPlan, activeTool, zoom, pan a canvasStore
- Migrar isCalculating, mcJob a calculationStore
- Prueba de flujo completo de calculo
- Tiempo estimado: 1-2 sesiones

### Fase 4: Remover useState legacy (v56) — RIESGO: BAJO
- Identificar useState no usados (dead code)
- Remover useState reemplazados por stores
- Limpieza de imports
- Tiempo estimado: 1 sesion

### Fase 5: Decomposicion completa (v57-60)
- Extraer DialogManager component
- Extraer ToolbarController component
- ShieldingDesigner.tsx < 500 lineas
- Tiempo estimado: 2-3 sesiones

## Patron de Migracion Segura

```typescript
// ANTES (v52):
const [showExportDialog, setShowExportDialog] = useState(false);
// ...
<Toolbar onExport={() => setShowExportDialog(true)} />
// ...
{showExportDialog && <ExportDialog open={showExportDialog} onClose={() => setShowExportDialog(false)} />}

// DESPUES (v53+):
const { isOpen, open, close } = useDialog("export");
// ...
<Toolbar onExport={open} />
// ...
{isOpen && <ExportDialog open={isOpen} onClose={close} />}
```

## Rollback Strategy
Si algo falla:
1. El store tiene `dialogs` con todos los nombres → nunca undefined
2. Los dialogs que no leen del store siguen funcionando con useState
3. Revertir un commit es seguro — los stores son aditivos, no destructivos
4. Feature flags: cada migracion va en su propio commit
