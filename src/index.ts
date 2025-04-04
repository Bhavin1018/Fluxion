/**
 * Fluxion - A modern, lightweight state management library for React applications
 */

// Export core functionality
export { createStore } from './store';
export { createHooks } from './hooks';
export {
  createLoggerMiddleware,
  createPersistMiddleware,
  createThrottleMiddleware,
  storageAdapters,
  createMemoryStorageAdapter,
  createIndexedDBStorageAdapter,
  createCookieStorageAdapter
} from './middleware';

// Export snapshot functionality
export {
  createSnapshotManager,
  createSnapshotMiddleware
} from './snapshot';

// Export async functionality
export {
  createAsyncAction,
  createAsyncMiddleware,
  createUseAsyncAction,
  isLoading,
  getErrors
} from './async';

// Export selector functionality
export {
  createSelector,
  createCombinedSelector,
  createSelectorFactory,
  shallowEqual
} from './selector';

// Export slice functionality
export {
  createSlice,
  createUseSlice
} from './slice';

// Export computed/derived state functionality
export {
  derived,
  createUseDerived,
  createUseDerivedWithDeps
} from './derived';

export {
  computed,
  computedWith,
  createUseComputed,
  createUseComputedWith
} from './computed';

// Export vanilla JavaScript adapter
export {
  createVanillaStore,
  computed as vanillaComputed,
  action
} from './vanilla';

// Export types
export type {
  Store,
  StoreOptions,
  Listener,
  Selector,
  StateUpdater,
  Subscription,
  Dispatch,
  Middleware,
  HookFactory
} from './types';

// Export snapshot types
export type {
  Snapshot,
  SnapshotOptions,
  SnapshotManager
} from './snapshot';

// Export async types
export type {
  AsyncState,
  AsyncActionOptions
} from './async';

// Export selector types
export type {
  SelectorOptions
} from './selector';

// Export slice types
export type {
  Slice
} from './slice';