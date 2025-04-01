import { Middleware, Store, Dispatch } from './types';

/**
 * Interface for a snapshot entry
 */
export interface Snapshot<T> {
  state: T;
  timestamp: number;
  description?: string;
}

/**
 * Interface for snapshot manager options
 */
export interface SnapshotOptions {
  maxSnapshots?: number;
  autoSnapshot?: boolean;
  autoSnapshotInterval?: number;
}

/**
 * Interface for the snapshot manager
 */
export interface SnapshotManager<T> {
  getSnapshots: () => Snapshot<T>[];
  takeSnapshot: (description?: string) => void;
  applySnapshot: (index: number) => void;
  clearSnapshots: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  undo: () => void;
  redo: () => void;
}

/**
 * Creates a snapshot manager for time-travel debugging
 * @param store The store to create snapshots for
 * @param options Configuration options for the snapshot manager
 * @returns A snapshot manager instance
 */
export function createSnapshotManager<T extends object>(
  store: Store<T>,
  options: SnapshotOptions = {}
): SnapshotManager<T> {
  const {
    maxSnapshots = 100,
    autoSnapshot = false,
    autoSnapshotInterval = 5000
  } = options;
  
  let snapshots: Snapshot<T>[] = [];
  let currentIndex = -1;
  let autoSnapshotTimer: ReturnType<typeof setInterval> | null = null;
  
  // Take a snapshot of the current state
  const takeSnapshot = (description?: string) => {
    const snapshot: Snapshot<T> = {
      state: { ...store.getState() },
      timestamp: Date.now(),
      description
    };
    
    // If we're not at the end of the snapshots array, remove future snapshots
    if (currentIndex < snapshots.length - 1) {
      snapshots = snapshots.slice(0, currentIndex + 1);
    }
    
    // Add the new snapshot
    snapshots.push(snapshot);
    currentIndex = snapshots.length - 1;
    
    // Remove oldest snapshots if we exceed the maximum
    if (snapshots.length > maxSnapshots) {
      snapshots.shift();
      currentIndex--;
    }
  };
  
  // Apply a snapshot at the given index
  const applySnapshot = (index: number) => {
    if (index >= 0 && index < snapshots.length) {
      currentIndex = index;
      store.setState(() => snapshots[index].state);
    }
  };
  
  // Clear all snapshots
  const clearSnapshots = () => {
    snapshots = [];
    currentIndex = -1;
  };
  
  // Check if we can undo
  const canUndo = () => currentIndex > 0;
  
  // Check if we can redo
  const canRedo = () => currentIndex < snapshots.length - 1;
  
  // Undo to the previous snapshot
  const undo = () => {
    if (canUndo()) {
      applySnapshot(currentIndex - 1);
    }
  };
  
  // Redo to the next snapshot
  const redo = () => {
    if (canRedo()) {
      applySnapshot(currentIndex + 1);
    }
  };
  
  // Start auto-snapshotting if enabled
  if (autoSnapshot && autoSnapshotInterval > 0) {
    autoSnapshotTimer = setInterval(() => {
      takeSnapshot('Auto snapshot');
    }, autoSnapshotInterval);
  }
  
  // Take initial snapshot
  takeSnapshot('Initial state');
  
  return {
    getSnapshots: () => snapshots,
    takeSnapshot,
    applySnapshot,
    clearSnapshots,
    canUndo,
    canRedo,
    undo,
    redo
  };
}

/**
 * Creates a snapshot middleware that records state changes
 * @param options Configuration options for the snapshot middleware
 * @returns A middleware function
 */
export function createSnapshotMiddleware<T>(
  options: { snapshotFilter?: (state: T, prevState: T) => boolean } = {}
): Middleware<T> {
  const { snapshotFilter } = options;
  
  return (nextState, prevState, dispatch) => {
    // If a filter is provided, only take snapshots when it returns true
    if (!snapshotFilter || snapshotFilter(nextState, prevState)) {
      // The actual snapshot is taken by the snapshot manager
      // This middleware just ensures the state passes through
    }
    
    return nextState;
  };
}