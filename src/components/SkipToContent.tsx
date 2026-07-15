/**
 * SkipToContent — v50.1: Skip-to-content link
 * WCAG 2.1 §2.4.1 — Bypass Blocks
 * Visible solo cuando tiene foco (keyboard navigation)
 */
export default function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] 
                 focus:bg-orange-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg 
                 focus:text-sm focus:font-medium focus:shadow-lg transition-all"
    >
      Saltar al contenido principal
    </a>
  );
}
