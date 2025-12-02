'use client';

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  keyExtractor?: (item: T, index: number) => string;
  emptyComponent?: ReactNode;
  loadingComponent?: ReactNode;
  isLoading?: boolean;
  gap?: number;
}

interface VirtualItem {
  index: number;
  start: number;
  size: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 5,
  className = '',
  onEndReached,
  endReachedThreshold = 200,
  keyExtractor,
  emptyComponent,
  loadingComponent,
  isLoading = false,
  gap = 0,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate item height
  const getItemHeight = useCallback(
    (index: number): number => {
      if (typeof itemHeight === 'function') {
        return itemHeight(index);
      }
      return itemHeight;
    },
    [itemHeight]
  );

  // Calculate total height and item positions
  const { totalHeight, itemPositions } = useMemo(() => {
    const positions: number[] = [];
    let total = 0;

    for (let i = 0; i < items.length; i++) {
      positions.push(total);
      total += getItemHeight(i) + (i < items.length - 1 ? gap : 0);
    }

    return { totalHeight: total, itemPositions: positions };
  }, [items.length, getItemHeight, gap]);

  // Find visible range
  const visibleRange = useMemo(() => {
    if (items.length === 0) return { startIndex: 0, endIndex: 0 };

    let startIndex = 0;
    let endIndex = items.length - 1;

    // Binary search for start index
    let low = 0;
    let high = items.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const itemEnd = itemPositions[mid] + getItemHeight(mid);

      if (itemEnd < scrollTop) {
        low = mid + 1;
      } else if (itemPositions[mid] > scrollTop) {
        high = mid - 1;
      } else {
        startIndex = mid;
        break;
      }
    }

    startIndex = Math.max(0, low - overscan);

    // Find end index
    const viewportEnd = scrollTop + containerHeight;

    for (let i = startIndex; i < items.length; i++) {
      if (itemPositions[i] > viewportEnd) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
    }

    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, items.length, itemPositions, getItemHeight, overscan]);

  // Generate virtual items
  const virtualItems = useMemo((): VirtualItem[] => {
    const result: VirtualItem[] = [];

    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      result.push({
        index: i,
        start: itemPositions[i],
        size: getItemHeight(i),
      });
    }

    return result;
  }, [visibleRange, itemPositions, getItemHeight]);

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop: newScrollTop, scrollHeight, clientHeight } = containerRef.current;
    setScrollTop(newScrollTop);

    // Check if near end
    if (onEndReached && scrollHeight - (newScrollTop + clientHeight) < endReachedThreshold) {
      onEndReached();
    }
  }, [onEndReached, endReachedThreshold]);

  // Set up scroll listener and resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial container height
    setContainerHeight(container.clientHeight);

    // Scroll listener
    container.addEventListener('scroll', handleScroll, { passive: true });

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [handleScroll]);

  // Scroll to index
  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      if (!containerRef.current || index < 0 || index >= items.length) return;

      containerRef.current.scrollTo({
        top: itemPositions[index],
        behavior,
      });
    },
    [items.length, itemPositions]
  );

  // Key extractor
  const getKey = useCallback(
    (item: T, index: number): string => {
      if (keyExtractor) {
        return keyExtractor(item, index);
      }
      return String(index);
    },
    [keyExtractor]
  );

  // Empty state
  if (items.length === 0 && !isLoading) {
    return <div className={className}>{emptyComponent}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
          contain: 'layout',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];

          return (
            <div
              key={getKey(item, virtualItem.index)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
                height: virtualItem.size,
                contain: 'layout',
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>

      {isLoading && loadingComponent}
    </div>
  );
}

// Grid version for card layouts
interface VirtualGridProps<T> extends Omit<VirtualListProps<T>, 'itemHeight'> {
  columns: number;
  itemHeight: number;
  columnGap?: number;
  rowGap?: number;
}

export function VirtualGrid<T>({
  items,
  columns,
  itemHeight,
  renderItem,
  overscan = 2,
  className = '',
  onEndReached,
  endReachedThreshold = 200,
  keyExtractor,
  emptyComponent,
  loadingComponent,
  isLoading = false,
  columnGap = 16,
  rowGap = 16,
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  // Calculate rows
  const rowCount = Math.ceil(items.length / columns);
  const rowHeight = itemHeight + rowGap;
  const totalHeight = rowCount * rowHeight - rowGap;

  // Calculate column width
  const columnWidth = useMemo(() => {
    if (containerWidth === 0) return 0;
    return (containerWidth - columnGap * (columns - 1)) / columns;
  }, [containerWidth, columns, columnGap]);

  // Find visible range
  const visibleRange = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endRow = Math.min(
      rowCount - 1,
      Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
    );

    return {
      startIndex: startRow * columns,
      endIndex: Math.min(items.length - 1, (endRow + 1) * columns - 1),
    };
  }, [scrollTop, containerHeight, rowHeight, rowCount, columns, items.length, overscan]);

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop: newScrollTop, scrollHeight, clientHeight } = containerRef.current;
    setScrollTop(newScrollTop);

    if (onEndReached && scrollHeight - (newScrollTop + clientHeight) < endReachedThreshold) {
      onEndReached();
    }
  }, [onEndReached, endReachedThreshold]);

  // Set up listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setContainerHeight(container.clientHeight);
    setContainerWidth(container.clientWidth);

    container.addEventListener('scroll', handleScroll, { passive: true });

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [handleScroll]);

  // Key extractor
  const getKey = useCallback(
    (item: T, index: number): string => {
      if (keyExtractor) {
        return keyExtractor(item, index);
      }
      return String(index);
    },
    [keyExtractor]
  );

  // Empty state
  if (items.length === 0 && !isLoading) {
    return <div className={className}>{emptyComponent}</div>;
  }

  // Generate visible items
  const visibleItems: { item: T; index: number; row: number; col: number }[] = [];

  for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
    if (i < items.length) {
      visibleItems.push({
        item: items[i],
        index: i,
        row: Math.floor(i / columns),
        col: i % columns,
      });
    }
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
          contain: 'layout',
        }}
      >
        {visibleItems.map(({ item, index, row, col }) => (
          <div
            key={getKey(item, index)}
            style={{
              position: 'absolute',
              top: row * rowHeight,
              left: col * (columnWidth + columnGap),
              width: columnWidth,
              height: itemHeight,
              contain: 'layout',
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {isLoading && loadingComponent}
    </div>
  );
}
