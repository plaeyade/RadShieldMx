// v94: CSS Animation utilities for dialogs and UI elements
import { useEffect, useState } from "react";

export function useFadeIn(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2";
}

export function useSlideIn(direction: "left" | "right" | "up" | "down" = "up", delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  
  const transforms = {
    left: visible ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0",
    right: visible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0",
    up: visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
    down: visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
  };
  
  return `${transforms[direction]} transition-all duration-300 ease-out`;
}

export function usePulse(active = true) {
  return active ? "animate-pulse" : "";
}

export function useScaleIn(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return visible ? "scale-100 opacity-100" : "scale-95 opacity-0";
}
