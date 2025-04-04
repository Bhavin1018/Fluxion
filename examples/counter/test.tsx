import React from 'react';
import ReactDOM from 'react-dom/client';

// Simple test component to verify React rendering
function TestComponent() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px', margin: '20px' }}>
      <h1>React Test Component</h1>
      <p>If you can see this, React is working properly.</p>
    </div>
  );
}

// Render the test component to the DOM
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestComponent />
  </React.StrictMode>
);