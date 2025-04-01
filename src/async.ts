import { Middleware, Dispatch } from './types';

/**
 * Interface for async action state
 */
export interface AsyncState {
  loading: Record<string, boolean>;
  errors: Record<string, Error | null>;
}

/**
 * Type for async action options
 */
export interface AsyncActionOptions {
  actionName?: string;
  onStart?: () => void;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  onFinally?: () => void;
}

/**
 * Creates an async action creator
 * @param store The store dispatch function
 * @returns A function to create async actions
 */
export function createAsyncAction<T extends object & AsyncState>(
  dispatch: Dispatch<T>
) {
  return function asyncAction<R>(
    action: () => Promise<R>,
    options: AsyncActionOptions = {}
  ): Promise<R> {
    const {
      actionName = 'async_action_' + Math.random().toString(36).substr(2, 9),
      onStart,
      onSuccess,
      onError,
      onFinally
    } = options;
    
    // Set loading state to true
    dispatch((state) => {
      state.loading = { ...state.loading, [actionName]: true };
      state.errors = { ...state.errors, [actionName]: null };
    });
    
    // Call onStart callback
    if (onStart) onStart();
    
    // Execute the async action
    return action()
      .then((result) => {
        // Set loading state to false on success
        dispatch((state) => {
          state.loading = { ...state.loading, [actionName]: false };
        });
        
        // Call onSuccess callback
        if (onSuccess) onSuccess(result);
        
        return result;
      })
      .catch((error) => {
        // Set loading state to false and store error on failure
        dispatch((state) => {
          state.loading = { ...state.loading, [actionName]: false };
          state.errors = { ...state.errors, [actionName]: error };
        });
        
        // Call onError callback
        if (onError) onError(error);
        
        throw error;
      })
      .finally(() => {
        // Call onFinally callback
        if (onFinally) onFinally();
      });
  };
}

/**
 * Creates a middleware that initializes async state
 * @returns A middleware function
 */
export function createAsyncMiddleware<T extends object>(): Middleware<T & AsyncState> {
  return (nextState) => {
    // Initialize async state if it doesn't exist
    if (!nextState.loading) {
      (nextState as T & AsyncState).loading = {};
    }
    
    if (!nextState.errors) {
      (nextState as T & AsyncState).errors = {};
    }
    
    return nextState;
  };
}

/**
 * Hook factory for async actions
 * @param useDispatch The useDispatch hook from createHooks
 * @returns A hook to create async actions
 */
export function createUseAsyncAction<T extends object & AsyncState>(
  useDispatch: () => Dispatch<T>
) {
  return function useAsyncAction() {
    const dispatch = useDispatch();
    return createAsyncAction<T>(dispatch);
  };
}

/**
 * Utility to check if any actions are loading
 * @param state The state with AsyncState
 * @param actionNames Optional array of action names to check
 * @returns True if any specified actions are loading
 */
export function isLoading<T extends AsyncState>(
  state: T,
  actionNames?: string[]
): boolean {
  if (!actionNames || actionNames.length === 0) {
    return Object.values(state.loading).some(Boolean);
  }
  
  return actionNames.some(name => state.loading[name]);
}

/**
 * Utility to get errors for actions
 * @param state The state with AsyncState
 * @param actionNames Optional array of action names to check
 * @returns Object with errors for the specified actions
 */
export function getErrors<T extends AsyncState>(
  state: T,
  actionNames?: string[]
): Record<string, Error | null> {
  if (!actionNames || actionNames.length === 0) {
    return state.errors;
  }
  
  const result: Record<string, Error | null> = {};
  actionNames.forEach(name => {
    result[name] = state.errors[name] || null;
  });
  
  return result;
}