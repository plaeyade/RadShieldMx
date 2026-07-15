/**
 * ═══════════════════════════════════════════════════════════
 * Onboarding Tour — react-joyride
 * ═══════════════════════════════════════════════════════════
 */

import { useState, useEffect } from "react";
import { Joyride, EVENTS, type EventData, STATUS, type Step } from "react-joyride";

const STORAGE_KEY = "radshield-tour-completed";

const TOUR_STEPS: Step[] = [
  {
    target: '[data-slot="dropdown-menu-trigger"]',
    title: "Toolbar Principal",
    content: "Accede a todas las herramientas: calculadoras, biblioteca, simulacion Monte Carlo, y los 5 agentes AI.",
    placement: "bottom",
  },
  {
    target: ".main-canvas-area",
    title: "Area de Trabajo",
    content: "Dibuja barreras, fuentes y regiones ocupadas aqui. Usa las herramientas del sidebar izquierdo.",
    placement: "center",
  },
  {
    target: ".main-canvas-area",
    title: "Herramientas",
    content: "Selecciona barreras, fuentes, medicion y mas. Arrastra para dibujar en el canvas.",
    placement: "left",
  },
];

function hasCompletedTour(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function markTourCompleted(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch { /* ignore */ }
}

export default function OnboardingTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!hasCompletedTour()) {
      const timer = setTimeout(() => {
        if (document.querySelector(TOUR_STEPS[0].target as string)) {
          setRun(true);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEvent = (data: EventData) => {
    const { status, type } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      markTourCompleted();
      setRun(false);
    }
    if (type === EVENTS.TARGET_NOT_FOUND) {
      markTourCompleted();
      setRun(false);
    }
  };

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={handleEvent}
      options={{
        buttons: ["back", "skip", "primary"],
        showProgress: true,
        primaryColor: "#7c3aed",
        textColor: "#0f172a",
        backgroundColor: "#ffffff",
        arrowColor: "#ffffff",
        zIndex: 10000,
      }}
      styles={{
        tooltip: {
          borderRadius: "12px",
          fontSize: "14px",
          padding: "16px",
        },
        tooltipTitle: {
          fontSize: "16px",
          fontWeight: 600,
          marginBottom: "8px",
        },
        buttonPrimary: {
          backgroundColor: "#7c3aed",
          borderRadius: "6px",
          fontSize: "13px",
          padding: "6px 14px",
        },
        buttonBack: {
          color: "#64748b",
          fontSize: "13px",
        },
        buttonSkip: {
          color: "#94a3b8",
          fontSize: "12px",
        },
      }}
      locale={{
        back: "Atras",
        close: "Cerrar",
        last: "Finalizar",
        next: "Siguiente",
        skip: "Omitir",
      }}
    />
  );
}
