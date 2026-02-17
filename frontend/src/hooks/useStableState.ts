import { useState, useRef, useCallback, useEffect } from 'react';

export function useStableState<T>(initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  const stateRef = useRef<T>(initialValue);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const stableSetState = useCallback((newValue: T | ((prev: T) => T)) => {
    if (!mountedRef.current) return;

    setState(prev => {
      const next = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prev) 
        : newValue;
      
      // Only update if value actually changed
      if (JSON.stringify(stateRef.current) !== JSON.stringify(next)) {
        stateRef.current = next;
        return next;
      }
      return prev;
    });
  }, []);

  return [state, stableSetState] as const;
}
