'use client';

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  memo,
  forwardRef
} from 'react';

/**
 * HOOKS DAN UTILITIES UNTUK OPTIMASI PERFORMA REACT
 * 
 * Mencegah re-render yang tidak perlu dan mengoptimalkan state management
 */

// ===== OPTIMIZED STATE HOOKS =====

/**
 * useState dengan debouncing untuk input yang sering berubah
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const updateValue = useCallback((newValue: T) => {
    setValue(newValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(newValue);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, debouncedValue, updateValue];
}

/**
 * useState dengan throttling untuk events yang sering terjadi
 */
export function useThrottledState<T>(
  initialValue: T,
  delay: number = 100
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const lastUpdateRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const updateValue = useCallback((newValue: T) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    if (timeSinceLastUpdate >= delay) {
      setValue(newValue);
      lastUpdateRef.current = now;
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setValue(newValue);
        lastUpdateRef.current = Date.now();
      }, delay - timeSinceLastUpdate);
    }
  }, [delay]);

  return [value, updateValue];
}

/**
 * State dengan shallow comparison untuk object/array
 */
export function useShallowState<T extends object>(
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialValue);

  const updateState = useCallback((value: T | ((prev: T) => T)) => {
    setState(prevState => {
      const newState = typeof value === 'function' ? value(prevState) : value;
      
      // Shallow comparison
      if (shallowEqual(prevState, newState)) {
        return prevState; // Prevent re-render if no changes
      }
      
      return newState;
    });
  }, []);

  return [state, updateState];
}

// ===== MEMOIZATION UTILITIES =====

/**
 * Shallow equality check
 */
function shallowEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || 
      obj1 == null || obj2 == null) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }

  return true;
}

/**
 * Deep equality check (use sparingly)
 */
function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || 
      obj1 == null || obj2 == null) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (let key of keys1) {
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

/**
 * useMemo dengan deep comparison
 */
export function useDeepMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  const ref = useRef<{ deps: React.DependencyList; value: T }>();

  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = {
      deps,
      value: factory(),
    };
  }

  return ref.current.value;
}

/**
 * useCallback dengan stable reference
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef<T>(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback(((...args: any[]) => {
    return callbackRef.current(...args);
  }) as T, []);
}

// ===== PERFORMANCE MONITORING HOOKS =====

/**
 * Hook untuk monitoring re-renders
 */
export function useRenderCount(componentName: string) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
  });

  return renderCount.current;
}

/**
 * Hook untuk monitoring prop changes
 */
export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any>>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });
    }

    previousProps.current = props;
  });
}

// ===== OPTIMIZED COMPONENT PATTERNS =====

/**
 * HOC untuk memoization dengan custom comparison
 */
export function withMemoization<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) {
  const MemoizedComponent = memo(Component, areEqual);
  MemoizedComponent.displayName = `Memoized(${Component.displayName || Component.name})`;
  return MemoizedComponent;
}

/**
 * HOC untuk shallow comparison memoization
 */
export function withShallowMemo<P extends object>(
  Component: React.ComponentType<P>
) {
  return withMemoization(Component, shallowEqual);
}

/**
 * Optimized list item component
 */
function OptimizedListItemComponent({
  item,
  index,
  onItemClick,
  renderItem,
}: {
  item: any;
  index: number;
  onItemClick: (item: any, index: number) => void;
  renderItem: (item: any, index: number) => React.ReactNode;
}) {
  const handleClick = useCallback(() => {
    onItemClick(item, index);
  }, [item, index, onItemClick]);

  return React.createElement(
    'div',
    { onClick: handleClick },
    renderItem(item, index)
  );
}

export const OptimizedListItem = memo(OptimizedListItemComponent);

// ===== PERFORMANCE UTILITIES =====

/**
 * Batch state updates untuk mengurangi re-renders
 */
export function useBatchedUpdates() {
  const [updates, setUpdates] = useState<Array<() => void>>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const batchUpdate = useCallback((updateFn: () => void) => {
    setUpdates(prev => [...prev, updateFn]);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setUpdates(currentUpdates => {
        currentUpdates.forEach(update => update());
        return [];
      });
    }, 0);
  }, []);

  return batchUpdate;
}

/**
 * Virtual scrolling hook untuk list besar
 */
export function useVirtualScrolling<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    visibleRange,
  };
}

// ===== USAGE EXAMPLES =====

/*
CONTOH PENGGUNAAN:

1. Debounced search input:
```tsx
function SearchComponent() {
  const [query, debouncedQuery, setQuery] = useDebouncedState('', 300);
  
  // API call hanya terjadi setelah user berhenti mengetik 300ms
  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <input 
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}
```

2. Optimized list component:
```tsx
const OptimizedList = memo(function OptimizedList({ items, onItemClick }) {
  const handleItemClick = useCallback((item, index) => {
    onItemClick(item.id, index);
  }, [onItemClick]);

  return (
    <div>
      {items.map((item, index) => (
        <OptimizedListItem
          key={item.id}
          item={item}
          index={index}
          onItemClick={handleItemClick}
          renderItem={(item) => <div>{item.name}</div>}
        />
      ))}
    </div>
  );
});
```

3. Performance monitoring:
```tsx
function MyComponent(props) {
  useRenderCount('MyComponent');
  useWhyDidYouUpdate('MyComponent', props);
  
  return <div>Component content</div>;
}
```
*/
