import { produce } from 'immer';
import {
  Store,
  StoreOptions,
  Listener,
  Selector,
  StateUpdater,
  Subscription,
  Dispatch,
  Middleware
} from './types';

/**
 * Creates a new store with the given initial state and options
 * @param initialState The initial state of the store
 * @param options Configuration options for the store
 * @returns A store instance
 */
export function createStore<T extends object>(
  initialState: T,
  options: StoreOptions<T> = {}
): Store<T> {
  const {
    middleware = [],
    devtools = false,
    name = 'ReactFlow Store'
  } = options;
  
  // Current state
  let state = { ...initialState };
  
  // Store listeners
  const listeners = new Set<Listener<T>>();
  
  // Get the current state
  const getState = (): T => state;
  
  // Apply middleware to state updates
  const applyMiddleware = (nextState: T, prevState: T): T => {
    let result = nextState;
    
    for (const middlewareFn of middleware) {
      const middlewareResult = middlewareFn(result, prevState, setState);
      if (middlewareResult !== undefined) {
        result = middlewareResult;
      }
    }
    
    return result;
  };
  
  // Update the state
  const setState: Dispatch<T> = (updater: StateUpdater<T>) => {
    const prevState = { ...state };
    let nextState: T;
    
    // Handle different types of updaters
    if (typeof updater === 'function') {
      const result = produce(state, (draft) => {
        return (updater as Function)(draft);
      });
      
      nextState = result as T;
    } else {
      nextState = { ...state, ...updater };
    }
    
    // Apply middleware
    if (middleware.length > 0) {
      nextState = applyMiddleware(nextState, prevState);
    }
    
    // Update state
    state = nextState;
    
    // Notify listeners
    listeners.forEach((listener) => listener(state, prevState));
    
    // Connect to Redux DevTools if enabled
    if (devtools && typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
      const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({
        name
      });
      devTools.send('UPDATE', state);
    }
  };
  
  // Subscribe to state changes
  const subscribe = (listener: Listener<T>): Subscription => {
    listeners.add(listener);
    
    return {
      unsubscribe: () => {
        listeners.delete(listener);
      }
    };
  };
  
  // Select a slice of state
  const use = <U>(selector: Selector<T, U>): U => {
    return selector(state);
  };
  
  // Clean up resources
  const destroy = () => {
    listeners.clear();
  };
  
  // Initialize DevTools if enabled
  if (devtools && typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
    const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({
      name
    });
    devTools.init(state);
  }
  
  return {
    getState,
    setState,
    subscribe,
    use,
    destroy
  };
}