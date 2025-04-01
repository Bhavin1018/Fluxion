import React, { useState, useEffect, useRef } from 'react';
import {
  createStore,
  createHooks,
  createLoggerMiddleware,
  createPersistMiddleware,
  createThrottleMiddleware,
  createAsyncMiddleware,
  createSnapshotManager,
  AsyncState
} from '../../src';

// Define our test state interfaces
interface TestState extends AsyncState {
  counter: number;
  text: string;
  deepNested: {
    level1: {
      level2: {
        level3: {
          value: string;
          array: number[];
        };
      };
    };
  };
  largeArray: number[];
  // Methods
  increment: () => void;
  decrement: () => void;
  setText: (text: string) => void;
  updateNestedValue: (value: string) => void;
  pushToNestedArray: (value: number) => void;
  resetNestedArray: () => void;
  generateLargeArray: (size: number) => void;
}

// Create our test store with initial state
const testStore = createStore<TestState>(
  {
    // Basic state
    counter: 0,
    text: '',
    deepNested: {
      level1: {
        level2: {
          level3: {
            value: 'initial',
            array: []
          }
        }
      }
    },
    largeArray: [],
    // Async state
    loading: {},
    errors: {},
    // Methods (will be initialized later)
    increment: () => {},
    decrement: () => {},
    setText: () => {},
    updateNestedValue: () => {},
    pushToNestedArray: () => {},
    resetNestedArray: () => {},
    generateLargeArray: () => {}
  },
  {
    middleware: [
      createLoggerMiddleware({ collapsed: true }),
      createPersistMiddleware('reactflow-error-test', {
        blacklist: ['largeArray'] // Don't persist large arrays
      }),
      createThrottleMiddleware(300), // Throttle updates to 300ms
      createAsyncMiddleware()
    ],
    devtools: true,
    name: 'ReactFlow Error Test Store'
  }
);

// Initialize store methods
testStore.setState((state) => {
  state.increment = () => testStore.setState(s => ({ counter: s.counter + 1 }));
  state.decrement = () => testStore.setState(s => ({ counter: s.counter - 1 }));
  state.setText = (text) => testStore.setState(() => ({ text }));
  state.updateNestedValue = (value) => testStore.setState(s => {
    s.deepNested.level1.level2.level3.value = value;
  });
  state.pushToNestedArray = (value) => testStore.setState(s => {
    s.deepNested.level1.level2.level3.array.push(value);
  });
  state.resetNestedArray = () => testStore.setState(s => {
    s.deepNested.level1.level2.level3.array = [];
  });
  state.generateLargeArray = (size) => testStore.setState(s => {
    s.largeArray = Array.from({ length: size }, (_, i) => i);
  });
});

// Create hooks for our store
const { useStore, useSelector, useDispatch } = createHooks(testStore);

// Create snapshot manager for time-travel debugging
const snapshotManager = createSnapshotManager(testStore, {
  maxSnapshots: 50,
  autoSnapshot: true
});

// Helper function to check if a component is leaking memory
function useMemoryLeakCheck() {
  const componentCount = useRef(0);
  
  useEffect(() => {
    componentCount.current++;
    console.log(`Component mounted. Total: ${componentCount.current}`);
    
    return () => {
      componentCount.current--;
      console.log(`Component unmounted. Total: ${componentCount.current}`);
    };
  }, []);
  
  return componentCount.current;
}

// Deep Nesting Test Component
function DeepNestingTest() {
  const nestedValue = useSelector(state => state.deepNested.level1.level2.level3.value);
  const nestedArray = useSelector(state => state.deepNested.level1.level2.level3.array);
  const [inputValue, setInputValue] = useState('');
  const [numberValue, setNumberValue] = useState(0);
  const [, setState] = useStore();
  
  const handleUpdateValue = () => {
    setState(s => s.updateNestedValue(inputValue));
  };
  
  const handlePushToArray = () => {
    setState(s => s.pushToNestedArray(numberValue));
  };
  
  const handleResetArray = () => {
    setState(s => s.resetNestedArray());
  };
  
  return (
    <div className="test-section">
      <h2>Deep Nesting Test</h2>
      <div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter a value"
        />
        <button onClick={handleUpdateValue}>Update Nested Value</button>
      </div>
      <p>Current nested value: {nestedValue}</p>
      
      <div>
        <input
          type="number"
          value={numberValue}
          onChange={(e) => setNumberValue(Number(e.target.value))}
        />
        <button onClick={handlePushToArray}>Add to Array</button>
        <button onClick={handleResetArray}>Reset Array</button>
      </div>
      <p>Nested array: [{nestedArray.join(', ')}]</p>
    </div>
  );
}

// Performance Test Component
function PerformanceTest() {
  const [arraySize, setArraySize] = useState(1000);
  const [updateCount, setUpdateCount] = useState(100);
  const [results, setResults] = useState<{operation: string, time: number}[]>([]);
  const [, setState] = useStore();
  
  const runLargeArrayTest = () => {
    // Generate a large array
    const start = performance.now();
    setState(s => s.generateLargeArray(arraySize));
    const end = performance.now();
    
    setResults(prev => [
      ...prev,
      { operation: `Generate array of ${arraySize} items`, time: end - start }
    ]);
  };
  
  const runRapidUpdatesTest = () => {
    const results: {operation: string, time: number}[] = [];
    
    // Test rapid state updates
    const start1 = performance.now();
    for (let i = 0; i < updateCount; i++) {
      testStore.setState(s => ({ counter: i }));
    }
    const end1 = performance.now();
    results.push({ 
      operation: `${updateCount} rapid counter updates`, 
      time: end1 - start1 
    });
    
    // Test deep nested updates
    const start2 = performance.now();
    for (let i = 0; i < updateCount; i++) {
      testStore.setState(s => {
        s.deepNested.level1.level2.level3.value = `value-${i}`;
      });
    }
    const end2 = performance.now();
    results.push({ 
      operation: `${updateCount} deep nested updates`, 
      time: end2 - start2 
    });
    
    setResults(prev => [...prev, ...results]);
  };
  
  const clearResults = () => {
    setResults([]);
  };
  
  return (
    <div className="test-section">
      <h2>Performance Test</h2>
      <div>
        <label>
          Array Size: 
          <input 
            type="number" 
            value={arraySize} 
            onChange={(e) => setArraySize(Number(e.target.value))} 
            min="100" 
            max="1000000"
          />
        </label>
        <button onClick={runLargeArrayTest}>Test Large Array</button>
      </div>
      
      <div>
        <label>
          Update Count: 
          <input 
            type="number" 
            value={updateCount} 
            onChange={(e) => setUpdateCount(Number(e.target.value))} 
            min="10" 
            max="10000"
          />
        </label>
        <button onClick={runRapidUpdatesTest}>Test Rapid Updates</button>
      </div>
      
      <button onClick={clearResults}>Clear Results</button>
      
      {results.length > 0 && (
        <div className="results">
          <h3>Results:</h3>
          <ul>
            {results.map((result, index) => (
              <li key={index}>
                {result.operation}: {result.time.toFixed(2)}ms
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Memory Leak Test Component
function MemoryLeakTest() {
  const [count, setCount] = useState(0);
  const [components, setComponents] = useState<React.ReactNode[]>([]);
  
  // Component that subscribes to store
  const SubscriberComponent = () => {
    useMemoryLeakCheck();
    useSelector(state => state.counter);
    return <div className="subscriber">Subscriber Component</div>;
  };
  
  const addComponents = () => {
    const newComponents = [...components];
    for (let i = 0; i < 10; i++) {
      newComponents.push(<SubscriberComponent key={`comp-${count + i}`} />);
    }
    setComponents(newComponents);
    setCount(count + 10);
  };
  
  const removeComponents = () => {
    setComponents([]);
    setCount(0);
  };
  
  return (
    <div className="test-section">
      <h2>Memory Leak Test</h2>
      <p>Components with store subscriptions: {count}</p>
      <div>
        <button onClick={addComponents}>Add 10 Components</button>
        <button onClick={removeComponents}>Remove All</button>
      </div>
      <div className="component-container" style={{ maxHeight: '200px', overflow: 'auto' }}>
        {components}
      </div>
      <p className="note">
        Check browser memory usage and console for memory leak detection.
      </p>
    </div>
  );
}

// Concurrent Updates Test Component
function ConcurrentUpdatesTest() {
  const [updateCount, setUpdateCount] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const counter = useSelector(state => state.counter);
  const [, setState] = useStore();
  
  const runConcurrentUpdates = () => {
    setIsRunning(true);
    
    // Reset counter
    setState(() => ({ counter: 0 }));
    
    // Schedule multiple updates with setTimeout
    for (let i = 0; i < updateCount; i++) {
      setTimeout(() => {
        setState(s => ({ counter: s.counter + 1 }));
        
        // Check if we're done
        if (i === updateCount - 1) {
          setIsRunning(false);
        }
      }, 0);
    }
  };
  
  return (
    <div className="test-section">
      <h2>Concurrent Updates Test</h2>
      <p>Current counter: {counter}</p>
      <div>
        <label>
          Update Count: 
          <input 
            type="number" 
            value={updateCount} 
            onChange={(e) => setUpdateCount(Number(e.target.value))} 
            min="10" 
            max="10000"
            disabled={isRunning}
          />
        </label>
        <button onClick={runConcurrentUpdates} disabled={isRunning}>
          {isRunning ? 'Running...' : 'Run Concurrent Updates'}
        </button>
      </div>
      <p className="note">
        This test schedules multiple state updates concurrently to test how the store handles them.
      </p>
    </div>
  );
}

// Edge Cases Test Component
function EdgeCasesTest() {
  const [result, setResult] = useState<string | null>(null);
  const [, setState] = useStore();
  
  const testCircularReference = () => {
    try {
      const circular: any = {};
      circular.self = circular;
      
      // This should throw an error or be handled gracefully
      testStore.setState({ circular } as any);
      setResult('Circular reference handled without error');
    } catch (error) {
      setResult(`Error with circular reference: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const testUndefinedUpdate = () => {
    try {
      // @ts-ignore - Testing invalid update
      testStore.setState(undefined);
      setResult('Undefined update handled without error');
    } catch (error) {
      setResult(`Error with undefined update: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const testNullUpdate = () => {
    try {
      // @ts-ignore - Testing invalid update
      testStore.setState(null);
      setResult('Null update handled without error');
    } catch (error) {
      setResult(`Error with null update: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const testInvalidSelector = () => {
    try {
      // @ts-ignore - Testing invalid selector
      const value = testStore.use(null);
      setResult(`Invalid selector returned: ${value}`);
    } catch (error) {
      setResult(`Error with invalid selector: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  return (
    <div className="test-section">
      <h2>Edge Cases Test</h2>
      <div className="button-group">
        <button onClick={testCircularReference}>Test Circular Reference</button>
        <button onClick={testUndefinedUpdate}>Test Undefined Update</button>
        <button onClick={testNullUpdate}>Test Null Update</button>
        <button onClick={testInvalidSelector}>Test Invalid Selector</button>
      </div>
      {result && (
        <div className="result">
          <h3>Result:</h3>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}

// Time Travel Debugging Test
function TimeTravelTest() {
  const [snapshots, setSnapshots] = useState(snapshotManager.getSnapshots());
  const [currentIndex, setCurrentIndex] = useState(snapshotManager.getCurrentIndex());
  
  // Update snapshots when they change
  useEffect(() => {
    const intervalId = setInterval(() => {
      setSnapshots(snapshotManager.getSnapshots());
      setCurrentIndex(snapshotManager.getCurrentIndex());
    }, 500);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const handleUndo = () => {
    snapshotManager.undo();
    setCurrentIndex(snapshotManager.getCurrentIndex());
  };
  
  const handleRedo = () => {
    snapshotManager.redo();
    setCurrentIndex(snapshotManager.getCurrentIndex());
  };
  
  const handleTakeSnapshot = () => {
    snapshotManager.takeSnapshot();
    setSnapshots(snapshotManager.getSnapshots());
    setCurrentIndex(snapshotManager.getCurrentIndex());
  };
  
  return (
    <div className="test-section">
      <h2>Time Travel Debugging Test</h2>
      <div className="button-group">
        <button onClick={handleTakeSnapshot}>Take Snapshot</button>
        <button onClick={handleUndo} disabled={currentIndex <= 0}>Undo</button>
        <button onClick={handleRedo} disabled={currentIndex >= snapshots.length - 1}>Redo</button>
      </div>
      
      <div>
        <h3>Snapshots ({snapshots.length}):</h3>
        <select 
          value={currentIndex}
          onChange={(e) => {
            const index = Number(e.target.value);
            if (index > currentIndex) {
              while (snapshotManager.getCurrentIndex() < index) {
                snapshotManager.redo();
              }
            } else if (index < currentIndex) {
              while (snapshotManager.getCurrentIndex() > index) {
                snapshotManager.undo();
              }
            }
            setCurrentIndex(index);
          }}
          size={5}
          style={{ width: '100%' }}
        >
          {snapshots.map((snapshot, index) => (
            <option key={index} value={index}>
              {index}: {new Date(snapshot.timestamp).toLocaleTimeString()}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Main App component
export function App() {
  return (
    <div className="error-test-app">
      <h1>ReactFlow Error Testing</h1>
      <p className="description">
        This application tests ReactFlow for potential errors, edge cases, and performance issues.
      </p>
      
      <DeepNestingTest />
      <PerformanceTest />
      <MemoryLeakTest />
      <ConcurrentUpdatesTest />
      <EdgeCasesTest />
      <TimeTravelTest />
    </div>
  );
}