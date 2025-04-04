# Fluxion

A modern, lightweight state management library for React applications that addresses the limitations of existing solutions like Redux, Zustand, and Nano Stores.

[![npm version](https://img.shields.io/npm/v/fluxion.svg?style=flat-square)](https://www.npmjs.com/package/fluxion)
[![npm downloads](https://img.shields.io/npm/dm/fluxion.svg?style=flat-square)](https://www.npmjs.com/package/fluxion)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/fluxion)](https://bundlephobia.com/package/fluxion)
[![license](https://img.shields.io/npm/l/fluxion.svg?style=flat-square)](https://github.com/fluxion/fluxion/blob/main/LICENSE)

## Features

- **Simple API**: Intuitive and minimal API that reduces boilerplate code
- **Performance Optimized**: Efficient updates with automatic memoization
- **TypeScript First**: Built with TypeScript for excellent type safety
- **Middleware Support**: Extensible with middleware for logging, persistence, etc.
- **Immer Integration**: Immutable updates with the simplicity of mutable code
- **DevTools Support**: Redux DevTools integration for debugging
- **Lightweight**: Small bundle size with minimal dependencies
- **React Hooks**: Modern React hooks API for accessing state
- **Async Actions**: Built-in support for async actions with loading states
- **Time-Travel Debugging**: Snapshot-based time-travel debugging
- **State Slicing**: Organize complex state with slices
- **Memoized Selectors**: Efficient state selection with customizable equality checks
- **Framework Agnostic**: Use with React or vanilla JavaScript

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Advanced Usage](#advanced-usage)
- [Comparison with Other Libraries](#comparison-with-other-libraries)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install fluxion
# or
yarn add fluxion
# or
pnpm add fluxion
```

## Basic Usage

```tsx
import { createStore, createHooks } from 'fluxion';

// Define your state type
interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

// Create a store with initial state
const counterStore = createStore<CounterState>({
  count: 0,
  increment: () => {},
  decrement: () => {}
});

// Initialize the store with methods
counterStore.setState((state) => {
  state.increment = () => counterStore.setState(s => ({ count: s.count + 1 }));
  state.decrement = () => counterStore.setState(s => ({ count: s.count - 1 }));
});

// Create hooks for the store
const { useStore, useSelector, useDispatch } = createHooks(counterStore);

// Use in components
function Counter() {
  // Option 1: Use the full store
  const [state, setState] = useStore();
  
  // Option 2: Select specific parts of state
  const count = useSelector(state => state.count);
  
  // Option 3: Get just the dispatch function
  const dispatch = useDispatch();
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={state.increment}>Increment</button>
      <button onClick={state.decrement}>Decrement</button>
    </div>
  );
}
```

## Core Concepts

Fluxion is built around these core concepts:

### Store

The store is the central repository for your application state. It provides methods for getting and updating state, as well as subscribing to state changes.

### Hooks

Fluxion provides React hooks for accessing and updating state in your components. These hooks are optimized to prevent unnecessary re-renders.

### Middleware

Middleware extends the functionality of your store. Fluxion includes middleware for logging, persistence, throttling, and more.

### Selectors

Selectors extract specific parts of your state. They can be memoized to prevent unnecessary recalculations.

### Slices

Slices organize your state into manageable sections. They provide a way to encapsulate related state and actions.

## API Reference

### `createStore<T>(initialState: T, options?: StoreOptions<T>): Store<T>`

Creates a new store with the given initial state and options.

**Parameters:**
- `initialState`: The initial state of the store
- `options`: Configuration options for the store
  - `middleware`: Array of middleware functions
  - `devtools`: Enable Redux DevTools integration (default: false)
  - `name`: Name for the store in DevTools (default: 'Fluxion Store')

**Returns:** A store instance with the following methods:
- `getState()`: Returns the current state
- `setState(updater)`: Updates the state
- `subscribe(listener)`: Subscribes to state changes
- `use(selector)`: Selects a slice of state
- `destroy()`: Cleans up resources

### `createHooks<T>(store: Store<T>): Hooks<T>`

Creates React hooks for a store.

**Parameters:**
- `store`: The store to create hooks for

**Returns:** An object with the following hooks:
- `useStore(selector?)`: Hook to access the full store or a selected part
- `useSelector(selector)`: Hook to select a specific part of state
- `useDispatch()`: Hook to get the setState function

### Middleware

#### `createLoggerMiddleware(options?)`

Creates middleware that logs state changes to the console.

#### `createPersistMiddleware(key, options?)`

Creates middleware that persists state to localStorage or other storage.

#### `createThrottleMiddleware(ms)`

Creates middleware that throttles state updates.

#### `createAsyncMiddleware()`

Creates middleware that initializes async state.

### Async Actions

#### `createAsyncAction(dispatch)`

Creates an async action creator with loading and error states.

#### `isLoading(state, actions?)`

Checks if any or specific async actions are loading.

#### `getErrors(state, actions?)`

Gets errors for any or specific async actions.

### Selectors

#### `createSelector(selector, options?)`

Creates a memoized selector.

#### `createCombinedSelector(selectors, combiner, options?)`

Creates a selector that combines multiple selectors.

### Slices

#### `createSlice(store, path)`

Creates a slice of state from a store.

#### `createUseSlice(useStore)`

Creates a hook for using slices of state.

## Advanced Usage

### Using Middleware

```tsx
import { createStore, createLoggerMiddleware, createPersistMiddleware } from 'fluxion';

const store = createStore(
  { count: 0 },
  {
    middleware: [
      createLoggerMiddleware({ collapsed: true }),
      createPersistMiddleware('my-app-state')
    ],
    devtools: true,
    name: 'My App Store'
  }
);
```

### Async Actions

Built-in support for async actions with loading states and error handling:

```tsx
import { createStore, createHooks, createAsyncMiddleware, createUseAsyncAction, isLoading, getErrors } from 'fluxion';

// Define your state type with async state
interface UserState {
  users: User[];
  loading: Record<string, boolean>;
  errors: Record<string, Error | null>;
  fetchUsers: () => Promise<User[]>;
}

// Create a store with async middleware
const userStore = createStore<UserState>(
  { users: [], loading: {}, errors: {} },
  {
    middleware: [createAsyncMiddleware()],
    devtools: true
  }
);

// Initialize async action
const useAsyncAction = createUseAsyncAction(() => userStore.setState);

userStore.setState((state) => {
  state.fetchUsers = useAsyncAction(
    async () => {
      const response = await fetch('https://api.example.com/users');
      const users = await response.json();
      userStore.setState({ users });
      return users;
    },
    { actionName: 'fetchUsers' }
  );
});

// Use in components
function UserList() {
  const users = useSelector(state => state.users);
  const fetchUsers = useSelector(state => state.fetchUsers);
  const loading = useSelector(state => isLoading(state, ['fetchUsers']));
  const errors = useSelector(state => getErrors(state, ['fetchUsers']));
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {errors.fetchUsers && <p>Error: {errors.fetchUsers.message}</p>}
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
      <button onClick={fetchUsers}>Refresh</button>
    </div>
  );
}
```

### Time-Travel Debugging

Snapshot-based time-travel debugging:

```tsx
import { createStore, createHooks, createSnapshotManager } from 'fluxion';
import { useState } from 'react';

// Create a store
const store = createStore({ count: 0 });

// Create a snapshot manager
const snapshots = createSnapshotManager(store, {
  maxSnapshots: 50,  // Maximum number of snapshots to keep
  autoSnapshot: true, // Automatically take snapshots on state changes
  autoSnapshotInterval: 2000 // Take snapshots every 2 seconds
});

// Use in a debug component
function TimeTravel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const allSnapshots = snapshots.getSnapshots();
  
  return (
    <div className="time-travel">
      <h3>Time Travel Debugging</h3>
      <div className="controls">
        <button 
          onClick={snapshots.undo} 
          disabled={!snapshots.canUndo()}
        >
          Undo
        </button>
        <button 
          onClick={snapshots.redo} 
          disabled={!snapshots.canRedo()}
        >
          Redo
        </button>
        <button onClick={() => snapshots.takeSnapshot('Manual snapshot')}>
          Take Snapshot
        </button>
      </div>
      <div className="snapshot-list">
        {allSnapshots.map((snapshot, index) => (
          <div 
            key={snapshot.timestamp}
            className={index === currentIndex ? 'active' : ''}
            onClick={() => {
              snapshots.applySnapshot(index);
              setCurrentIndex(index);
            }}
          >
            {new Date(snapshot.timestamp).toLocaleTimeString()}
            {snapshot.description && ` - ${snapshot.description}`}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Using with Vanilla JavaScript

ReactFlow can be used without React:

```js
import { createStore, createVanillaStore } from 'reactflow';

// Create a store
const store = createStore({
  count: 0,
  increment: () => {},
  decrement: () => {}
});

// Initialize methods
store.setState((state) => {
  state.increment = () => store.setState(s => ({ count: s.count + 1 }));
  state.decrement = () => store.setState(s => ({ count: s.count - 1 }));
});

// Create a vanilla adapter
const vanillaStore = createVanillaStore(store, {
  onChange: (state) => {
    // Update UI when state changes
    document.getElementById('count').textContent = state.count;
  }
});

// Use the store
document.getElementById('increment').addEventListener('click', () => {
  vanillaStore.getState().increment();
});

document.getElementById('decrement').addEventListener('click', () => {
  vanillaStore.getState().decrement();
});
```

## Examples

See the [examples](./examples) directory for more examples, including:

- [Counter](./examples/counter): Basic counter example
- [Todo App](./examples/todo-app): Complete todo application
- [Async](./examples/advanced): Async data fetching example
- [Vanilla JS](./examples/vanilla-js): Usage without React
- [Error Testing](./examples/error-test): Edge case handling

## Comparison with Other Libraries

### vs Redux

| Feature | Redux | ReactFlow |
|---------|-------|----------|
| Boilerplate | High (actions, reducers, etc.) | Low (direct state updates) |
| Bundle Size | ~30KB | ~5KB |
| Immutability | Manual or with Immer | Built-in Immer integration |
| TypeScript Support | Good | Excellent |
| Middleware | Complex API | Simple API |
| Async Actions | Requires redux-thunk/saga | Built-in |
| Selectors | Manual memoization | Automatic memoization |
| DevTools | Yes | Yes |
| Time-Travel | Basic | Advanced with snapshots |
| Learning Curve | Steep | Gentle |

### vs Zustand

| Feature | Zustand | ReactFlow |
|---------|---------|----------|
| API Style | Similar | Similar but more consistent |
| Bundle Size | ~3KB | ~5KB |
| TypeScript Support | Good | Excellent |
| Middleware | Basic | Comprehensive |
| Async Actions | Manual | Built-in helpers |
| Selectors | Basic | Advanced with dependencies |
| State Organization | Flat | Slices and nested state |
| Time-Travel | Basic | Advanced with snapshots |
| Vanilla JS Support | Yes | Yes |

### vs Jotai/Recoil

| Feature | Jotai/Recoil | ReactFlow |
|---------|-------------|----------|
| State Model | Atoms | Centralized store |
| Context Provider | Required | Not required |
| Bundle Size | ~7-10KB | ~5KB |
| TypeScript Support | Good | Excellent |
| Async State | Atom-level | Action-level |
| Server-Side Rendering | Complex | Simple |
| Debugging | Basic | Advanced with time-travel |
| Learning Curve | Medium | Low |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
```

### State Slicing

Organize complex state with slices:

```tsx
import { createStore, createSlice, createUseSlice, createHooks } from 'reactflow';

interface AppState {
  users: { list: User[]; filter: string };
  posts: { list: Post[]; selectedId: number | null };
}

const store = createStore<AppState>({
  users: { list: [], filter: '' },
  posts: { list: [], selectedId: null }
});

// Create slices
const usersSlice = createSlice(store, 'users');
const postsSlice = createSlice(store, 'posts');

// Use in components with custom hook
const { useStore } = createHooks(store);
const useSlice = createUseSlice(useStore);

function UserFilter() {
  const [users, setUsers] = useSlice('users');
  
  return (
    <input
      value={users.filter}
      onChange={e => setUsers({ filter: e.target.value })}
    />
  );
}
```

### Memoized Selectors

Efficient state selection with automatic memoization:

```tsx
import { createStore, createSelector, createHooks } from 'reactflow';

const store = createStore({ users: { list: [], filter: '' } });
const { useSelector } = createHooks(store);

const selectFilteredUsers = createSelector(
  (state) => {
    const { list, filter } = state.users;
    if (!filter) return list;
    return list.filter(user => 
      user.name.toLowerCase().includes(filter.toLowerCase())
    );
  },
  { deps: [] }
);

function UserList() {
  // Use in components
  const filteredUsers = useSelector(selectFilteredUsers);
  
  return (
    <ul>
      {filteredUsers.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

### Creating Custom Middleware

```tsx
import { Middleware } from 'reactflow';

const analyticsMiddleware: Middleware<MyState> = (nextState, prevState) => {
  // Track state changes
  if (nextState.user !== prevState.user) {
    analytics.track('User Changed', { userId: nextState.user.id });
  }
  
  return nextState;
};
```

### Multiple Stores

ReactFlow encourages using multiple small stores instead of one large store:

```tsx
// userStore.ts
const userStore = createStore({ name: '', email: '' });
export const { useStore: useUserStore } = createHooks(userStore);

// cartStore.ts
const cartStore = createStore({ items: [] });
export const { useStore: useCartStore } = createHooks(cartStore);
```

## Why ReactFlow?

### Compared to Redux

- Much less boilerplate code
- No action types, action creators, or reducers
- Simpler API with direct state updates
- Better TypeScript support out of the box
- More intuitive async action handling

### Compared to Zustand

- More efficient React integration with automatic memoization
- Built-in middleware system
- Better DevTools integration
- More intuitive API for complex state updates
- First-class support for async actions with loading states
- Advanced time-travel debugging with snapshots
- Better state organization with slices
- More powerful selector system with customizable equality checks

### Compared to Nano Stores

- Better TypeScript support
- More powerful middleware system
- Immer integration for easier immutable updates
- React-specific optimizations
- Built-in time-travel debugging
- Advanced state slicing capabilities
- Integrated async action handling

## Examples

Check out the examples directory for more advanced usage patterns:

- [Counter Example](./examples/counter/index.tsx) - Basic counter with Redux DevTools integration
- [Todo App Example](./examples/todo-app/index.tsx) - Todo application with persistence
- [Advanced Example](./examples/advanced/index.tsx) - Showcase of all advanced features including:
  - Async actions with loading states
  - Time-travel debugging with snapshots
  - State slicing for complex state management
  - Memoized selectors for performance optimization

## License

MIT