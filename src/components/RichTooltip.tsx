/**
 * RichTooltip — A.4: Tooltips con descripcion, shortcut, ecuacion y referencia
 * Nielsen (1994) Heuristic #10 — Help and documentation should be easy to search
 */
import { useState, useRef, useCallback, type ReactNode } from 'react';
import { BookOpen, Command, FunctionSquare } from 'lucide-react';

interface RichTooltipProps {
  children: ReactNode;
  title: string;
  description: string;
  shortcut?: string;
  equation?: string;
  reference?: string;
  referenceUrl?: string;
}

export default function RichTooltip({
  children, title, description, shortcut, equation, reference, referenceUrl,
}: RichTooltipProps) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShow(true), 400);
  }, []);

  const handleLeave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShow(false), 200);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] p-3 animate-in fade-in slide-in-from-bottom-1 duration-150">
          <div className="text-xs font-semibold text-slate-800 mb-1">{title}</div>
          <div className="text-[11px] text-slate-600 leading-relaxed mb-2">{description}</div>
          {shortcut && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1.5">
              <Command className="w-3 h-3" />
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono">{shortcut}</kbd>
            </div>
          )}
          {equation && (
            <div className="flex items-start gap-1.5 text-[10px] text-indigo-600 bg-indigo-50 rounded p-1.5 mb-1.5 font-mono">
              <FunctionSquare className="w-3 h-3 mt-0.5 shrink-0" />
              <span>{equation}</span>
            </div>
          )}
          {reference && (
            <div className="flex items-center gap-1 text-[9px] text-slate-400">
              <BookOpen className="w-2.5 h-2.5" />
              {referenceUrl ? (
                <a href={referenceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 hover:underline">{reference}</a>
              ) : (
                <span>{reference}</span>
              )}
            </div>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2 h-2 bg-white border-r border-b border-slate-200 rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}
