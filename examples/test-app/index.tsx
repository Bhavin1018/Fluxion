import React, { useState, useEffect } from 'react';
import {
  createStore,
  createHooks,
  createLoggerMiddleware,
  createPersistMiddleware,
  createAsyncMiddleware,
  createUseAsyncAction,
  createSelector,
  createSlice,
  createUseSlice,
  createSnapshotManager,
  isLoading,
  getErrors
} from '../../src';

// Define our state interfaces
interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  removeTodo: (id: number) => void;
  setFilter: (filter: 'all' | 'active' | 'completed') => void;
}

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => void;
}

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
}

// Create the counter store
const counterStore = createStore<CounterState>(
  {
    count: 0,
    increment: () => {},
    decrement: () => {},
    reset: () => {}
  },
  {
    middleware: [createLoggerMiddleware({ collapsed: true })],
    devtools: true,
    name: 'Counter Store'
  }
);

// Initialize counter store methods
counterStore.setState((state) => {
  state.increment = () => counterStore.setState(s => ({ count: s.count + 1 }));
  state.decrement = () => counterStore.setState(s => ({ count: s.count - 1 }));
  state.reset = () => counterStore.setState(() => ({ count: 0 }));
});

// Create hooks for counter store
const { useStore: useCounterStore, useSelector: useCounterSelector } = createHooks(counterStore);

// Create the todo store
const todoStore = createStore<TodoState>(
  {
    todos: [],
    filter: 'all',
    addTodo: () => {},
    toggleTodo: () => {},
    removeTodo: () => {},
    setFilter: () => {}
  },
  {
    middleware: [
      createLoggerMiddleware({ collapsed: true }),
      createPersistMiddleware('test-app-todos')
    ],
    devtools: true,
    name: 'Todo Store'
  }
);

// Initialize todo store methods
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
  
  state.setFilter = (filter) => todoStore.setState(() => ({ filter }));
});

// Create hooks for todo store
const { useStore: useTodoStore, useSelector: useTodoSelector } = createHooks(todoStore);

// Create todo selectors
const selectFilteredTodos = createSelector<TodoState, Todo[]>(
  (state) => {
    const { todos, filter } = state;
    
    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  }
);

// Create the user store with async support
const userStore = createStore<UserState>(
  {
    users: [],
    loading: false,
    error: null,
    fetchUsers: () => {}
  },
  {
    middleware: [
      createLoggerMiddleware({ collapsed: true }),
      createAsyncMiddleware()
    ],
    devtools: true,
    name: 'User Store'
  }
);

// Initialize user store methods
userStore.setState((state) => {
  state.fetchUsers = () => {
    // Set loading state
    userStore.setState(s => ({ loading: true, error: null }));
    
    // Fetch users from API
    fetch('https://jsonplaceholder.typicode.com/users')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        return response.json();
      })
      .then(users => {
        userStore.setState(s => ({
          users,
          loading: false
        }));
      })
      .catch(error => {
        userStore.setState(s => ({
          loading: false,
          error: error.message
        }));
      });
  };
});

// Create hooks for user store
const { useStore: useUserStore, useSelector: useUserSelector } = createHooks(userStore);

// Create snapshot manager for time-travel debugging
const snapshotManager = createSnapshotManager(todoStore, {
  maxSnapshots: 10,
  autoSnapshot: true,
  autoSnapshotInterval: 5000
});

// Counter Component
function Counter() {
  const [state] = useCounterStore();
  
  return (
    <div className="section">
      <h2>Counter Example</h2>
      <p>Count: {state.count}</p>
      <div className="buttons">
        <button onClick={state.decrement}>-</button>
        <button onClick={state.reset}>Reset</button>
        <button onClick={state.increment}>+</button>
      </div>
    </div>
  );
}

// Todo Component
function TodoApp() {
  const [state] = useTodoStore();
  const [newTodo, setNewTodo] = useState('');
  const filteredTodos = useTodoSelector(selectFilteredTodos);
  
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      state.addTodo(newTodo.trim());
      setNewTodo('');
    }
  };
  
  return (
    <div className="section">
      <h2>Todo Example</h2>
      
      <form onSubmit={handleAddTodo}>
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo"
        />
        <button type="submit">Add</button>
      </form>
      
      <div className="filters">
        <button 
          className={state.filter === 'all' ? 'active' : ''}
          onClick={() => state.setFilter('all')}
        >
          All
        </button>
        <button 
          className={state.filter === 'active' ? 'active' : ''}
          onClick={() => state.setFilter('active')}
        >
          Active
        </button>
        <button 
          className={state.filter === 'completed' ? 'active' : ''}
          onClick={() => state.setFilter('completed')}
        >
          Completed
        </button>
      </div>
      
      <ul className="todo-list">
        {filteredTodos.map(todo => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            <span onClick={() => state.toggleTodo(todo.id)}>{todo.text}</span>
            <button onClick={() => state.removeTodo(todo.id)}>×</button>
          </li>
        ))}
      </ul>
      
      <div className="time-travel">
        <h3>Time Travel</h3>
        <button onClick={() => snapshotManager.takeSnapshot('Manual snapshot')}>Take Snapshot</button>
        <button onClick={() => snapshotManager.undo()}>Undo</button>
        <button onClick={() => snapshotManager.redo()}>Redo</button>
      </div>
    </div>
  );
}

// User Component with Async Actions
function UserList() {
  const [state] = useUserStore();
  
  useEffect(() => {
    // Fetch users when component mounts
    state.fetchUsers();
  }, []);
  
  return (
    <div className="section">
      <h2>User Example (Async)</h2>
      
      <button 
        onClick={state.fetchUsers}
        disabled={state.loading}
      >
        {state.loading ? 'Loading...' : 'Refresh Users'}
      </button>
      
      {state.error && (
        <div className="error">{state.error}</div>
      )}
      
      {!state.loading && !state.error && (
        <ul className="user-list">
          {state.users.map(user => (
            <li key={user.id}>
              <strong>{user.name}</strong> ({user.email})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Main App Component
export function App() {
  return (
    <div className="test-app">
      <h1>ReactFlow Test Application</h1>
      <p>Testing the core features of the ReactFlow state management library</p>
      
      <Counter />
      <TodoApp />
      <UserList />
    </div>
  );
}