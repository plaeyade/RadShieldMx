/**
 * VirtualList — Virtualización de listas largas para rendimiento
 * Recomendación v44 #17: Solo renderizar items visibles en el viewport
 * Compatible con BibliographyDialog, Equipment lists, y cualquier lista >50 items
 */
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  containerHeight: number;
  overscan?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight,
  overscan = 5,
  className = '',
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;

  const visibleRange = useMemo(() => {
    const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIdx = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIdx, endIdx };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const visibleItems = useMemo(() => {
    const { startIdx, endIdx } = visibleRange;
    return items.slice(startIdx, endIdx + 1).map((item, i) => ({
      item,
      index: startIdx + i,
      offset: (startIdx + i) * itemHeight,
    }));
  }, [visibleRange, items]);

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, offset }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: offset,
              height: itemHeight,
              width: '100%',
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
