# ReactFlow Usage Guide

This guide provides step-by-step instructions on how to use ReactFlow, a modern, lightweight state management library for React applications.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Usage](#basic-usage)
3. [Using Hooks](#using-hooks)
4. [Middleware](#middleware)
5. [Async Actions](#async-actions)
6. [State Slicing](#state-slicing)
7. [Selectors](#selectors)
8. [Time-Travel Debugging](#time-travel-debugging)
9. [Using with Vanilla JavaScript](#using-with-vanilla-javascript)
10. [TypeScript Integration](#typescript-integration)
11. [Real-World Examples](#real-world-examples)
12. [Performance Optimization](#performance-optimization)

## Getting Started

### Installation

```bash
npm install reactflow
# or
yarn add reactflow
```

### Basic Concepts

ReactFlow is built around these core concepts:

- **Store**: A central repository for your application state
- **Hooks**: React hooks to access and update state
- **Middleware**: Plugins that extend store functionality
- **Selectors**: Functions to extract specific parts of state
- **Slices**: Organized sections of your state

## Basic Usage

### Creating a Store

Start by creating a store with your initial state:

```tsx
import { createStore, createHooks } from 'reactflow';

// Define your state type
interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

// Create a store with initial state
const counterStore = createStore<CounterState>({
  count: 0,
  increment: () => {},
  decrement: () => {},
  reset: () => {}
});

// Initialize the store with methods
counterStore.setState((state) => {
  state.increment = () => counterStore.setState(s => ({ count: s.count + 1 }));
  state.decrement = () => counterStore.setState(s => ({ count: s.count - 1 }));
  state.reset = () => counterStore.setState(() => ({ count: 0 }));
});
```

## Using Hooks

ReactFlow provides several hooks to access your store in React components:

### Create Hooks

```tsx
// Create hooks for the store
const { useStore, useSelector, useDispatch } = createHooks(counterStore);
```

### Using the Full Store

```tsx
function CounterWithFullStore() {
  const [state] = useStore();
  
  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={state.decrement}>-</button>
      <button onClick={state.reset}>Reset</button>
      <button onClick={state.increment}>+</button>
    </div>
  );
}
```

### Using Selectors

```tsx
function CounterWithSelector() {
  const count = useSelector(state => state.count);
  const [, setState] = useStore();
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setState(s => ({ count: s.count - 1 }))}>-</button>
      <button onClick={() => setState(() => ({ count: 0 }))}>Reset</button>
      <button onClick={() => setState(s => ({ count: s.count + 1 }))}>+</button>
    </div>
  );
}
```

## Middleware

ReactFlow supports middleware for extending store functionality:

```tsx
import { createStore, createLoggerMiddleware, createPersistMiddleware } from 'reactflow';

const store = createStore(
  { count: 0 },
  {
    middleware: [
      createLoggerMiddleware({ collapsed: true }),
      createPersistMiddleware('my-app-state')
    ],
    devtools: true
  }
);
```

### Available Middleware

#### Logger Middleware

Logs state changes to the console with customizable options:

```tsx
createLoggerMiddleware({
  collapsed: true, // Use collapsed console groups
  diff: true       // Show state differences
})
```

#### Persist Middleware

Persists state to localStorage or other storage adapters:

```tsx
createPersistMiddleware('storage-key', {
  blacklist: ['temporaryState', 'largeData'], // State keys to exclude
  storage: storageAdapters.localStorage,      // Custom storage adapter
  serialize: JSON.stringify,                  // Custom serialization
  deserialize: JSON.parse,                    // Custom deserialization
  debug: false                                // Enable debug logging
})
```

ReactFlow provides several storage adapters:

```tsx
import { storageAdapters } from 'reactflow';

// Available adapters
storageAdapters.localStorage    // Browser localStorage
storageAdapters.sessionStorage // Browser sessionStorage
storageAdapters.indexedDB      // IndexedDB storage
storageAdapters.cookies        // Cookie storage
storageAdapters.memory         // In-memory storage (for testing)

// Create custom adapter
const customAdapter = createStorageAdapter({
  getItem: (key) => { /* ... */ },
  setItem: (key, value) => { /* ... */ },
  removeItem: (key) => { /* ... */ }
});
```

#### Throttle Middleware

Throttles state updates to improve performance:

```tsx
createThrottleMiddleware(300) // Throttle updates to 300ms
```

#### Custom Middleware

Create your own middleware for custom functionality:

```tsx
const loggingMiddleware = (nextState, prevState, dispatch) => {
  console.log('State updated:', nextState);
  return nextState; // Always return the next state
};

const store = createStore(
  initialState,
  { middleware: [loggingMiddleware] }
);
```

## Async Actions

ReactFlow provides built-in support for async actions with loading states and error handling:

```tsx
import { createStore, createHooks, createAsyncMiddleware, createUseAsyncAction, isLoading, getErrors } from 'reactflow';

// Define your state type with async state
interface UserState {
  users: User[];
  loading: Record<string, boolean>;
  errors: Record<string, Error | null>;
  fetchUsers: () => Promise<User[]>;
}

// Create store with async middleware
const store = createStore<UserState>(
  { users: [], loading: {}, errors: {}, fetchUsers: async () => [] },
  { middleware: [createAsyncMiddleware()] }
);

const { useSelector } = createHooks(store);
const useAsyncAction = createUseAsyncAction(() => store.setState);

// Initialize async action
store.setState((state) => {
  state.fetchUsers = useAsyncAction(
    async () => {
      const response = await fetch('https://api.example.com/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const users = await response.json();
      store.setState({ users });
      return users;
    },
    { actionName: 'fetchUsers' }
  );
});

function UserComponent() {
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

### Advanced Async Patterns

#### Cancellable Requests

ReactFlow supports cancellable async actions to prevent race conditions:

```tsx
import { createStore, createHooks, createAsyncMiddleware, createUseAsyncAction } from 'reactflow';

interface SearchState {
  results: SearchResult[];
  search: (query: string) => Promise<SearchResult[]>;
  loading: Record<string, boolean>;
  errors: Record<string, Error | null>;
}

const searchStore = createStore<SearchState>(
  { results: [], search: async () => [], loading: {}, errors: {} },
  { middleware: [createAsyncMiddleware()] }
);

const { useSelector } = createHooks(searchStore);
const useAsyncAction = createUseAsyncAction(() => searchStore.setState);

searchStore.setState((state) => {
  state.search = useAsyncAction(
    async (query: string, { signal }) => {
      // The signal parameter is automatically provided and can be passed to fetch
      const response = await fetch(`https://api.example.com/search?q=${query}`, { signal });
      if (!response.ok) throw new Error('Search failed');
      const results = await response.json();
      searchStore.setState({ results });
      return results;
    },
    { actionName: 'search', cancelPrevious: true } // This will cancel previous in-flight requests
  );
});
```

#### Debounced Async Actions

Combine async actions with debouncing for improved performance:

```tsx
import { createStore, createHooks, createAsyncMiddleware, createUseAsyncAction } from 'reactflow';
import { debounce } from './utils';

interface AutocompleteState {
  suggestions: string[];
  getSuggestions: (input: string) => Promise<string[]>;
  loading: Record<string, boolean>;
  errors: Record<string, Error | null>;
}

const autocompleteStore = createStore<AutocompleteState>(
  { suggestions: [], getSuggestions: async () => [], loading: {}, errors: {} },
  { middleware: [createAsyncMiddleware()] }
);

const { useSelector } = createHooks(autocompleteStore);
const useAsyncAction = createUseAsyncAction(() => autocompleteStore.setState);

// Create a debounced async action
const debouncedFetch = debounce(async (input: string, signal: AbortSignal) => {
  const response = await fetch(`https://api.example.com/autocomplete?q=${input}`, { signal });
  if (!response.ok) throw new Error('Autocomplete failed');
  return response.json();
}, 300);

autocompleteStore.setState((state) => {
  state.getSuggestions = useAsyncAction(
    async (input: string, { signal }) => {
      const suggestions = await debouncedFetch(input, signal);
      autocompleteStore.setState({ suggestions });
      return suggestions;
    },
    { actionName: 'getSuggestions', cancelPrevious: true }
  );
});
```

### Async Utilities

#### `isLoading(state, actions?)`

Checks if any or specific async actions are loading:

```tsx
// Check if any action is loading
const anyLoading = isLoading(state);

// Check if specific actions are loading
const usersLoading = isLoading(state, ['fetchUsers']);
const multipleLoading = isLoading(state, ['fetchUsers', 'fetchPosts']);
```

#### `getErrors(state, actions?)`

Gets errors for any or specific async actions:

```tsx
// Get all errors
const allErrors = getErrors(state);

// Get errors for specific actions
const userErrors = getErrors(state, ['fetchUsers']);
const multipleErrors = getErrors(state, ['fetchUsers', 'fetchPosts']);
```

#### `createAsyncAction` Options

The `createAsyncAction` function accepts several options to customize behavior:

```tsx
const fetchData = useAsyncAction(
  async (params, { signal, dispatch }) => {
    // Implementation
  },
  {
    actionName: 'fetchData',           // Required: unique name for the action
    cancelPrevious: true,              // Optional: cancel previous in-flight requests
    onStart: (params) => {},           // Optional: callback when action starts
    onSuccess: (result, params) => {}, // Optional: callback on successful completion
    onError: (error, params) => {},    // Optional: callback on error
    onSettled: (params) => {},         // Optional: callback when action completes (success or error)
    errorTransformer: (error) => error // Optional: transform errors before storing
  }
);
```
```

## State Slicing

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

## Time-Travel Debugging

Implement time-travel debugging with snapshots:

```tsx
import { createStore, createSnapshotManager } from 'reactflow';

const store = createStore({ /* initial state */ });

// Create snapshot manager
const snapshotManager = createSnapshotManager(store, {
  maxSnapshots: 50,
  autoSnapshot: true,
  autoSnapshotInterval: 5000
});

// In your debug UI
function DebugControls() {
  const snapshots = snapshotManager.getSnapshots();
  
  return (
    <div>
      <button onClick={() => snapshotManager.undo()}>Undo</button>
      <button onClick={() => snapshotManager.redo()}>Redo</button>
      <select 
        onChange={e => snapshotManager.restoreSnapshot(Number(e.target.value))}
      >
        {snapshots.map((snapshot, index) => (
          <option key={index} value={index}>
            {new Date(snapshot.timestamp).toLocaleTimeString()}
          </option>
        ))}
      </select>
    </div>
  );
}
```

## Real-World Examples

### Todo App

A complete todo application with filtering:

```tsx
import React, { useState } from 'react';
import { createStore, createHooks, createPersistMiddleware } from 'reactflow';

// Define Todo type
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// Define Todo store state
interface TodoState {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  removeTodo: (id: number) => void;
  clearCompleted: () => void;
}

// Create Todo store
const todoStore = createStore<TodoState>(
  {
    todos: [],
    addTodo: () => {},
    toggleTodo: () => {},
    removeTodo: () => {},
    clearCompleted: () => {}
  },
  {
    middleware: [createPersistMiddleware('todo-app')],
    devtools: true
  }
);

// Initialize Todo store methods
todoStore.setState((state) => {
  state.addTodo = (text) => todoStore.setState(s => ({
    todos: [...s.todos, { id: Date.now(), text, completed: false }]
  }));
  
  state.toggleTodo = (id) => todoStore.setState(s => ({
    todos: s.todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  }));
  
  state.removeTodo = (id) => todoStore.setState(s => ({
    todos: s.todos.filter(todo => todo.id !== id)
  }));
  
  state.clearCompleted = () => todoStore.setState(s => ({
    todos: s.todos.filter(todo => !todo.completed)
  }));
});

// Create hooks
const { useStore, useSelector } = createHooks(todoStore);

// Todo App Component
function TodoApp() {
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState('all');
  const [state] = useStore();
  
  // Filter todos based on current filter
  const filteredTodos = state.todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });
  
  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    state.addTodo(newTodo);
    setNewTodo('');
  };
  
  return (
    <div>
      <h1>Todo App</h1>
      
      <form onSubmit={handleAddTodo}>
        <input
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          placeholder="What needs to be done?"
        />
        <button type="submit">Add</button>
      </form>
      
      <ul>
        {filteredTodos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => state.toggleTodo(todo.id)}
            />
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
            <button onClick={() => state.removeTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
      
      <div>
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
        <button onClick={state.clearCompleted}>Clear Completed</button>
      </div>
    </div>
  );
}
```

## Using with Vanilla JavaScript

ReactFlow can be used without React through its vanilla JavaScript API:

```js
import { createVanillaStore } from 'reactflow/vanilla';

// Create a store
const todoStore = createVanillaStore({
  todos: [],
  filter: 'all'
});

// Subscribe to state changes
const unsubscribe = todoStore.subscribe((state) => {
  console.log('State updated:', state);
  renderTodos(state.todos, state.filter);
});

// Update state
todoStore.setState((state) => {
  state.todos.push({ id: Date.now(), text: 'New todo', completed: false });
});

// Get current state
const currentState = todoStore.getState();

// Clean up when done
unsubscribe();
```

## Comparison with Other Libraries

### ReactFlow vs Zustand

| Feature | ReactFlow | Zustand |
|---------|-----------|--------|
| **Core Principle** | Lightweight, intuitive API with built-in async support | Minimal state management with hooks |
| **Immutability** | Uses Immer for immutable updates | Uses Immer optionally |
| **Middleware** | Built-in middleware for logging, persistence, etc. | Middleware through custom stores |
| **TypeScript** | First-class TypeScript support | Good TypeScript support |
| **Async Actions** | Built-in async action utilities | Requires custom implementation |
| **Selectors** | Optimized selectors with memoization | Basic selector support |
| **State Slicing** | Built-in state slicing | Requires custom implementation |
| **Bundle Size** | ~4KB (gzipped) | ~3KB (gzipped) |
| **Learning Curve** | Simple, intuitive API | Simple but requires more boilerplate for advanced features |

### ReactFlow vs Nanostores

| Feature | ReactFlow | Nanostores |
|---------|-----------|------------|
| **Core Principle** | Unified API for React with built-in features | Atomic approach with specialized stores |
| **Framework Support** | React-focused with vanilla JS support | Framework-agnostic |
| **TypeScript** | First-class TypeScript support | Good TypeScript support |
| **Async Support** | Built-in async utilities | Requires custom implementation |
| **Middleware** | Comprehensive middleware system | Limited middleware support |
| **State Organization** | Slices and selectors | Atomic stores |
| **Bundle Size** | ~4KB (gzipped) | ~2KB (gzipped) |
| **Debugging** | DevTools and time-travel debugging | Basic logging |

## TypeScript Integration

ReactFlow is built with TypeScript and provides excellent type safety:

```tsx
// Define your state type
interface UserState {
  users: User[];
  selectedId: number | null;
  selectUser: (id: number) => void;
  fetchUsers: () => Promise<User[]>;
}

// Create a typed store
const userStore = createStore<UserState>({
  users: [],
  selectedId: null,
  selectUser: () => {},
  fetchUsers: async () => []
});

// Type inference works automatically
userStore.setState((state) => {
  state.selectUser = (id) => userStore.setState({ selectedId: id });
});

// Type errors are caught at compile time
userStore.setState((state) => {
  // @ts-expect-error - Property 'invalid' does not exist
  state.invalid = true;
});
```

## Performance Optimization

ReactFlow is designed for performance with these best practices:

1. **Use selectors** to prevent unnecessary re-renders
2. **Memoize selectors** for complex computations
3. **Split large stores** into smaller, focused stores
4. **Use middleware** like throttle for high-frequency updates
5. **Implement shallow equality** checks for complex objects

```tsx
import { createStore, createHooks, createSelector } from 'reactflow';

const store = createStore({ items: [], filter: '' });
const { useSelector } = createHooks(store);

// Create a memoized selector
const getFilteredItems = createSelector(
  state => state.items,
  state => state.filter,
  (items, filter) => items.filter(item => 
    item.name.toLowerCase().includes(filter.toLowerCase())
  )
);

function ItemList() {
  // Only re-renders when the filtered result changes
  const filteredItems = useSelector(getFilteredItems);
  
  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

This guide covers the essential features of ReactFlow. For more advanced usage and examples, check out the examples directory in the repository.

## Contributing

We welcome contributions to ReactFlow! Please see our [Contributing Guide](./CONTRIBUTING.md) for more information.

## License

ReactFlow is [MIT licensed](./LICENSE).