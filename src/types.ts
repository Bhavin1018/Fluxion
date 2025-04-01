/**
 * Core types for the ReactFlow state management library
 */

/**
 * Represents a listener function that is called when state changes
 */
export type Listener<T> = (state: T, prevState: T) => void;

/**
 * Represents a selector function that extracts a slice of state
 */
export type Selector<T, U> = (state: T) => U;

/**
 * Represents a state updater function
 */
export type StateUpdater<T> = (state: T) => T | Partial<T> | void;

/**
 * Represents a dispatch function for actions
 */
export type Dispatch<T> = (updater: StateUpdater<T>) => void;

/**
 * Represents a middleware function that can intercept and modify state updates
 */
export type Middleware<T> = (
  nextState: T,
  prevState: T,
  dispatch: Dispatch<T>
) => T | void;

/**
 * Represents a subscription to state changes
 */
export interface Subscription {
  unsubscribe: () => void;
}

/**
 * Represents the store configuration options
 */
export interface StoreOptions<T> {
  middleware?: Middleware<T>[];
  devtools?: boolean;
  name?: string;
}

/**
 * Represents the core store interface
 */
export interface Store<T> {
  getState: () => T;
  setState: (updater: StateUpdater<T>) => void;
  subscribe: (listener: Listener<T>) => Subscription;
  use: <U>(selector: Selector<T, U>) => U;
  destroy: () => void;
}

/**
 * Represents a hook factory that creates React hooks for accessing store state
 */
export interface HookFactory<T> {
  useStore: <U>(selector?: Selector<T, U>) => [U, Dispatch<T>];
  useSelector: <U>(selector: Selector<T, U>) => U;
  useDispatch: () => Dispatch<T>;
}