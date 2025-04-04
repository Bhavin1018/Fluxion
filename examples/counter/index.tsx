import React from 'react';
import { createStore, createHooks, createLoggerMiddleware } from '../../src';

// Define the state interface
interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

// Create a store with initial state
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
    name: 'Counter Example'
  }
);

// Initialize the store with methods
counterStore.setState((state) => {
  state.increment = () => counterStore.setState(s => ({ count: s.count + 1 }));
  state.decrement = () => counterStore.setState(s => ({ count: s.count - 1 }));
  state.reset = () => counterStore.setState(() => ({ count: 0 }));
});

// Create hooks for the store
const { useStore, useSelector } = createHooks(counterStore);

// Counter component using the full store
function CounterWithFullStore() {
  const [state] = useStore();
  
  return (
    <div className="counter">
      <h2>Counter with Full Store</h2>
      <p>Count: {state.count}</p>
      <div className="buttons">
        <button onClick={state.decrement}>-</button>
        <button onClick={state.reset}>Reset</button>
        <button onClick={state.increment}>+</button>
      </div>
    </div>
  );
}

// Counter component using selector
function CounterWithSelector() {
  const count = useSelector(state => state.count);
  const [, setState] = useStore();
  
  return (
    <div className="counter">
      <h2>Counter with Selector</h2>
      <p>Count: {count}</p>
      <div className="buttons">
        <button onClick={() => setState(s => ({ count: s.count - 1 }))}>-</button>
        <button onClick={() => setState(() => ({ count: 0 }))}>Reset</button>
        <button onClick={() => setState(s => ({ count: s.count + 1 }))}>+</button>
      </div>
    </div>
  );
}

// App component
export function App() {
  return (
    <div className="app">
      <h1>Fluxion Counter Example</h1>
      <div className="counters">
        <CounterWithFullStore />
        <CounterWithSelector />
      </div>
      <p className="info">
        Open the Redux DevTools to see state changes in real-time.
      </p>
    </div>
  );
}