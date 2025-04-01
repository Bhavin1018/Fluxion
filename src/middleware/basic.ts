/**
 * Basic middleware implementations for ReactFlow
 */

import { Middleware } from '../types';

/**
 * Creates a logger middleware that logs state changes
 * @param options Configuration options for the logger
 * @returns A middleware function
 */
export function createLoggerMiddleware<T>(
  options: { 
    collapsed?: boolean; 
    diff?: boolean;
    predicate?: (nextState: T, prevState: T) => boolean;
    colors?: {
      title?: string;
      prevState?: string;
      nextState?: string;
      diff?: string;
    };
  } = {}
): Middleware<T> {
  const { 
    collapsed = false, 
    diff = true,
    predicate = () => true,
    colors = {
      title: '#4CAF50',
      prevState: '#9E9E9E',
      nextState: '#2196F3',
      diff: '#FF5722'
    }
  } = options;
  
  return (nextState, prevState) => {
    if (typeof window === 'undefined' || !predicate(nextState, prevState)) return nextState;
    
    const groupMethod = collapsed ? console.groupCollapsed : console.group;
    
    groupMethod(`%c ReactFlow State Update`, `color: ${colors.title}; font-weight: bold;`);
    console.log(`%c Previous State`, `color: ${colors.prevState}; font-weight: bold;`, prevState);
    console.log(`%c Next State`, `color: ${colors.nextState}; font-weight: bold;`, nextState);
    
    if (diff) {
      console.log(`%c Differences`, `color: ${colors.diff}; font-weight: bold;`);
      const differences = findDifferences(prevState, nextState);
      console.log(differences);
    }
    
    console.groupEnd();
    
    return nextState;
  };
}

/**
 * Creates a throttle middleware that limits the frequency of state updates
 * @param ms The minimum time between updates in milliseconds
 * @param options Additional options for throttling
 * @returns A middleware function
 */
export function createThrottleMiddleware<T>(
  ms: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
  } = {}
): Middleware<T> {
  const { leading = true, trailing = true } = options;
  let lastUpdate = 0;
  let pendingState: T | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (nextState, prevState, dispatch) => {
    const now = Date.now();
    const elapsed = now - lastUpdate;
    
    // Clear any existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    if (elapsed >= ms) {
      // Allow the update to go through immediately (leading edge)
      if (leading) {
        lastUpdate = now;
        return nextState;
      }
    }
    
    // Store the latest state for trailing edge updates
    if (trailing) {
      pendingState = nextState;
      
      // Schedule a trailing edge update
      timeoutId = setTimeout(() => {
        if (pendingState) {
          lastUpdate = Date.now();
          dispatch(() => pendingState);
          pendingState = null;
        }
      }, Math.max(0, ms - elapsed));
    }
    
    // Cancel this update
    return prevState;
  };
}

/**
 * Creates a debounce middleware that delays state updates until after a specified time
 * @param ms The time to wait before applying the update
 * @param options Additional options for debouncing
 * @returns A middleware function
 */
export function createDebounceMiddleware<T>(
  ms: number,
  options: {
    leading?: boolean;
    maxWait?: number;
  } = {}
): Middleware<T> {
  const { leading = false, maxWait } = options;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0;
  let lastInvokeTime = 0;
  let pendingState: T | null = null;
  
  return (nextState, prevState, dispatch) => {
    const now = Date.now();
    lastCallTime = now;
    
    // Clear any existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    // Check if this is the first call or if we should invoke immediately
    const shouldInvoke = leading && (lastInvokeTime === 0 || now - lastInvokeTime >= ms);
    
    if (shouldInvoke) {
      lastInvokeTime = now;
      return nextState;
    }
    
    // Store the latest state
    pendingState = nextState;
    
    // Schedule a normal debounced update
    timeoutId = setTimeout(() => {
      if (pendingState) {
        lastInvokeTime = Date.now();
        dispatch(() => pendingState);
        pendingState = null;
      }
    }, ms);
    
    // If maxWait is specified, also schedule a max wait timeout
    if (maxWait !== undefined && timeoutId !== null) {
      const timeSinceLastInvoke = now - lastInvokeTime;
      const maxWaitTimeout = maxWait - timeSinceLastInvoke;
      
      if (maxWaitTimeout > 0) {
        setTimeout(() => {
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
            
            if (pendingState) {
              lastInvokeTime = Date.now();
              dispatch(() => pendingState);
              pendingState = null;
            }
          }
        }, maxWaitTimeout);
      }
    }
    
    // Cancel this update
    return prevState;
  };
}

/**
 * Finds differences between two objects
 * @param objA First object
 * @param objB Second object
 * @returns An object containing the differences
 */
function findDifferences(objA: any, objB: any): any {
  if (objA === objB) return {};
  
  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return { from: objA, to: objB };
  }
  
  const differences: Record<string, any> = {};
  
  // Check for keys in objA that are different in objB
  Object.keys(objA).forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(objB, key)) {
      differences[key] = { from: objA[key], to: undefined };
    } else if (
      typeof objA[key] === 'object' && objA[key] !== null &&
      typeof objB[key] === 'object' && objB[key] !== null
    ) {
      const nestedDiff = findDifferences(objA[key], objB[key]);
      if (Object.keys(nestedDiff).length > 0) {
        differences[key] = nestedDiff;
      }
    } else if (!Object.is(objA[key], objB[key])) {
      differences[key] = { from: objA[key], to: objB[key] };
    }
  });
  
  // Check for keys in objB that are not in objA
  Object.keys(objB).forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(objA, key)) {
      differences[key] = { from: undefined, to: objB[key] };
    }
  });
  
  return differences;
}