/**
 * ═══════════════════════════════════════════════════════════
 * i18n — Minimal Internationalization System (E.2)
 * Spanish (default) + English
 * ═══════════════════════════════════════════════════════════
 */

export type Locale = "es" | "en";

const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  es: {
    "app.title": "RadShield-MX",
    "app.version": "Versión",
    "toolbar.file": "Archivo",
    "toolbar.edit": "Editar",
    "toolbar.view": "Ver",
    "toolbar.tools": "Herramientas",
    "toolbar.calculate": "Calcular",
    "toolbar.reports": "Reportes",
    "toolbar.help": "Ayuda",
    "canvas.zoomIn": "Acercar",
    "canvas.zoomOut": "Alejar",
    "canvas.zoomFit": "Ajustar vista",
    "canvas.pan": "Desplazar",
    "canvas.select": "Seleccionar",
    "canvas.drawBarrier": "Dibujar barrera",
    "canvas.drawSource": "Dibujar fuente",
    "canvas.measure": "Medir",
    "dialog.export": "Exportar",
    "dialog.exportCSV": "Exportar CSV",
    "dialog.exportJSON": "Exportar JSON",
    "dialog.exportExcel": "Exportar Excel",
    "dialog.close": "Cerrar",
    "dialog.cancel": "Cancelar",
    "dialog.save": "Guardar",
    "dialog.delete": "Eliminar",
    "calc.barrierPrimary": "Barrera primaria",
    "calc.barrierSecondary": "Barrera secundaria",
    "calc.maze": "Laberinto",
    "calc.door": "Puerta",
    "calc.roof": "Techo",
    "calc.material": "Material",
    "calc.thickness": "Espesor",
    "calc.tvls": "TVLs",
    "calc.transmission": "Transmisión",
    "ai.assistant.title": "Asistente AI",
    "ai.send": "Enviar",
    "ai.placeholder": "Pregunta sobre blindaje radiológico...",
    "ai.streaming": "Generando respuesta...",
    "ai.sources": "Fuentes",
    "error.title": "Error",
    "error.retry": "Reintentar",
    "success.saved": "Guardado correctamente",
    "success.exported": "Exportado correctamente",
    "undo.action": "Deshacer",
    "redo.action": "Rehacer",
    "welcome.title": "Bienvenido a RadShield-MX",
    "welcome.subtitle": "Diseño de blindajes radiológicos con 5 capas de inteligencia artificial",
    "welcome.start": "Comenzar",
    "welcome.manual": "Manual de usuario",
  },
  en: {
    "app.title": "RadShield-MX",
    "app.version": "Version",
    "toolbar.file": "File",
    "toolbar.edit": "Edit",
    "toolbar.view": "View",
    "toolbar.tools": "Tools",
    "toolbar.calculate": "Calculate",
    "toolbar.reports": "Reports",
    "toolbar.help": "Help",
    "canvas.zoomIn": "Zoom in",
    "canvas.zoomOut": "Zoom out",
    "canvas.zoomFit": "Fit view",
    "canvas.pan": "Pan",
    "canvas.select": "Select",
    "canvas.drawBarrier": "Draw barrier",
    "canvas.drawSource": "Draw source",
    "canvas.measure": "Measure",
    "dialog.export": "Export",
    "dialog.exportCSV": "Export CSV",
    "dialog.exportJSON": "Export JSON",
    "dialog.exportExcel": "Export Excel",
    "dialog.close": "Close",
    "dialog.cancel": "Cancel",
    "dialog.save": "Save",
    "dialog.delete": "Delete",
    "calc.barrierPrimary": "Primary barrier",
    "calc.barrierSecondary": "Secondary barrier",
    "calc.maze": "Maze",
    "calc.door": "Door",
    "calc.roof": "Roof",
    "calc.material": "Material",
    "calc.thickness": "Thickness",
    "calc.tvls": "TVLs",
    "calc.transmission": "Transmission",
    "ai.assistant.title": "AI Assistant",
    "ai.send": "Send",
    "ai.placeholder": "Ask about radiation shielding...",
    "ai.streaming": "Generating response...",
    "ai.sources": "Sources",
    "error.title": "Error",
    "error.retry": "Retry",
    "success.saved": "Saved successfully",
    "success.exported": "Exported successfully",
    "undo.action": "Undo",
    "redo.action": "Redo",
    "welcome.title": "Welcome to RadShield-MX",
    "welcome.subtitle": "Radiation shielding design with 5 AI intelligence layers",
    "welcome.start": "Start",
    "welcome.manual": "User manual",
  },
};

let currentLocale: Locale = "es";

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  try {
    localStorage.setItem("radshield-locale", locale);
  } catch { /* ignore */ }
}

export function getLocale(): Locale {
  try {
    const saved = localStorage.getItem("radshield-locale") as Locale;
    if (saved === "es" || saved === "en") return saved;
  } catch { /* ignore */ }
  return currentLocale;
}

export function t(key: string): string {
  return TRANSLATIONS[getLocale()][key] || TRANSLATIONS["es"][key] || key;
}

export function toggleLocale(): Locale {
  const newLocale = getLocale() === "es" ? "en" : "es";
  setLocale(newLocale);
  return newLocale;
}
