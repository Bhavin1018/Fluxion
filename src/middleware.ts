import { Middleware } from './types';

/**
 * Creates a logger middleware that logs state changes
 * @param options Configuration options for the logger
 * @returns A middleware function
 */
export function createLoggerMiddleware<T>(
  options: { collapsed?: boolean; diff?: boolean } = {}
): Middleware<T> {
  const { collapsed = false, diff = true } = options;
  
  return (nextState, prevState) => {
    if (typeof window === 'undefined') return nextState;
    
    const groupMethod = collapsed ? console.groupCollapsed : console.group;
    
    groupMethod('%c ReactFlow State Update', 'color: #4CAF50; font-weight: bold;');
    console.log('%c Previous State', 'color: #9E9E9E; font-weight: bold;', prevState);
    console.log('%c Next State', 'color: #2196F3; font-weight: bold;', nextState);
    
    if (diff) {
      console.log('%c Differences', 'color: #FF5722; font-weight: bold;');
      const differences = findDifferences(prevState, nextState);
      console.log(differences);
    }
    
    console.groupEnd();
    
    return nextState;
  };
}

/**
 * Creates a persistence middleware that saves state to localStorage
 * @param key The key to use for localStorage
 * @param options Configuration options for persistence
 * @returns A middleware function
 */
export function createPersistMiddleware<T>(
  key: string,
  options: { blacklist?: (keyof T)[] } = {}
): Middleware<T> {
  const { blacklist = [] } = options;
  
  // Load initial state from localStorage
  let initialState: Partial<T> = {};
  
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const savedState = localStorage.getItem(key);
      if (savedState) {
        initialState = JSON.parse(savedState);
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  }
  
  return (nextState) => {
    if (typeof window === 'undefined' || !window.localStorage) return nextState;
    
    try {
      // Filter out blacklisted keys
      const filteredState = { ...nextState };
      blacklist.forEach((key) => {
        delete filteredState[key as keyof T];
      });
      
      localStorage.setItem(key, JSON.stringify(filteredState));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
    
    return nextState;
  };
}

/**
 * Creates a throttle middleware that limits the frequency of state updates
 * @param ms The minimum time between updates in milliseconds
 * @returns A middleware function
 */
export function createThrottleMiddleware<T>(ms: number): Middleware<T> {
  let lastUpdate = 0;
  let pendingState: T | null = null;
  
  return (nextState, prevState, dispatch) => {
    const now = Date.now();
    
    if (now - lastUpdate >= ms) {
      lastUpdate = now;
      return nextState;
    } else {
      // Store the latest state
      pendingState = nextState;
      
      // Schedule an update
      setTimeout(() => {
        if (pendingState) {
          dispatch(() => pendingState);
          pendingState = null;
        }
      }, ms - (now - lastUpdate));
      
      // Cancel this update
      return prevState;
    }
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