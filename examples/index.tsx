import React from 'react';
import ReactDOM from 'react-dom/client';
import { App as CounterApp } from './counter';
import { App as TodoApp } from './todo-app';
import { App as TestApp } from './test-app';
import './styles.css';

// Example selector component
function ExampleSelector() {
  const [example, setExample] = React.useState<'counter' | 'todo' | 'test'>('counter');
  
  return (
    <div className="example-selector">
      <div className="selector-buttons">
        <button 
          className={example === 'counter' ? 'active' : ''}
          onClick={() => setExample('counter')}
        >
          Counter Example
        </button>
        <button 
          className={example === 'todo' ? 'active' : ''}
          onClick={() => setExample('todo')}
        >
          Todo App Example
        </button>
        <button 
          className={example === 'test' ? 'active' : ''}
          onClick={() => setExample('test')}
        >
          Test Application
        </button>
      </div>
      
      <div className="example-container">
        {example === 'counter' ? <CounterApp /> : 
         example === 'todo' ? <TodoApp /> : <TestApp />}
      </div>
    </div>
  );
}

// Main app
function App() {
  return (
    <div className="main-app">
      <header>
        <h1>ReactFlow Examples</h1>
        <p className="subtitle">
          A modern, lightweight state management library for React applications
        </p>
      </header>
      
      <ExampleSelector />
      
      <footer>
        <p>
          ReactFlow is designed to be a better alternative to existing state management libraries
          like Redux, Zustand, and Nano Stores.
        </p>
      </footer>
    </div>
  );
}

// Render the app
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);