import React, { useState } from 'react';
import { createStore, createHooks, createPersistMiddleware, createLoggerMiddleware } from '../../src';

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

// Define Filter store state
interface FilterState {
  filter: 'all' | 'active' | 'completed';
  setFilter: (filter: 'all' | 'active' | 'completed') => void;
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
    middleware: [
      createLoggerMiddleware({ collapsed: true }),
      createPersistMiddleware('todo-app-todos')
    ],
    devtools: true,
    name: 'Todo Store'
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

// Create Filter store
const filterStore = createStore<FilterState>(
  {
    filter: 'all',
    setFilter: () => {}
  },
  {
    middleware: [
      createPersistMiddleware('todo-app-filter')
    ],
    devtools: true,
    name: 'Filter Store'
  }
);

// Initialize Filter store methods
filterStore.setState((state) => {
  state.setFilter = (filter) => filterStore.setState(() => ({ filter }));
});

// Create hooks for both stores
const { useStore: useTodoStore, useSelector: useTodoSelector } = createHooks(todoStore);
const { useStore: useFilterStore, useSelector: useFilterSelector } = createHooks(filterStore);

// TodoInput component
function TodoInput() {
  const [text, setText] = useState('');
  const [, setState] = useTodoStore();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      setState(s => s.addTodo(text.trim()));
      setText('');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="todo-form">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs to be done?"
        className="todo-input"
      />
      <button type="submit" className="add-button">Add</button>
    </form>
  );
}

// TodoItem component
function TodoItem({ todo }: { todo: Todo }) {
  const [, setState] = useTodoStore();
  
  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => setState(s => s.toggleTodo(todo.id))}
        className="todo-checkbox"
      />
      <span className="todo-text">{todo.text}</span>
      <button
        onClick={() => setState(s => s.removeTodo(todo.id))}
        className="delete-button"
      >
        ×
      </button>
    </li>
  );
}

// TodoList component
function TodoList() {
  const todos = useTodoSelector(s => s.todos);
  const filter = useFilterSelector(s => s.filter);
  
  // Filter todos based on current filter
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });
  
  return (
    <ul className="todo-list">
      {filteredTodos.length === 0 ? (
        <li className="empty-message">
          {filter === 'all' ? 'No todos yet!' : `No ${filter} todos!`}
        </li>
      ) : (
        filteredTodos.map(todo => <TodoItem key={todo.id} todo={todo} />)
      )}
    </ul>
  );
}

// TodoFilter component
function TodoFilter() {
  const filter = useFilterSelector(s => s.filter);
  const [, setFilterState] = useFilterStore();
  
  return (
    <div className="filters">
      <button
        className={filter === 'all' ? 'active' : ''}
        onClick={() => setFilterState(s => s.setFilter('all'))}
      >
        All
      </button>
      <button
        className={filter === 'active' ? 'active' : ''}
        onClick={() => setFilterState(s => s.setFilter('active'))}
      >
        Active
      </button>
      <button
        className={filter === 'completed' ? 'active' : ''}
        onClick={() => setFilterState(s => s.setFilter('completed'))}
      >
        Completed
      </button>
    </div>
  );
}

// TodoFooter component
function TodoFooter() {
  const todos = useTodoSelector(s => s.todos);
  const [, setState] = useTodoStore();
  
  const activeCount = todos.filter(todo => !todo.completed).length;
  const completedCount = todos.length - activeCount;
  
  return (
    <div className="todo-footer">
      <span className="todo-count">
        {activeCount} {activeCount === 1 ? 'item' : 'items'} left
      </span>
      <TodoFilter />
      {completedCount > 0 && (
        <button
          className="clear-completed"
          onClick={() => setState(s => s.clearCompleted())}
        >
          Clear completed
        </button>
      )}
    </div>
  );
}

// App component
export function App() {
  return (
    <div className="todo-app">
      <h1>ReactFlow Todo App</h1>
      <div className="todo-container">
        <TodoInput />
        <TodoList />
        <TodoFooter />
      </div>
      <p className="info">
        This example demonstrates using multiple stores with ReactFlow.
        <br />
        Todo state and filter state are managed separately.
      </p>
    </div>
  );
}