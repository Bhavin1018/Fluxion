import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { createStore } from '../store';
import { createHooks } from '../hooks';

// Mock React hooks
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual as object,
    useState: vi.fn().mockImplementation(actual.useState),
    useEffect: vi.fn().mockImplementation(actual.useEffect),
    useRef: vi.fn().mockImplementation(actual.useRef),
    useCallback: vi.fn().mockImplementation(actual.useCallback)
  };
});

describe('Hooks', () => {
  interface TestState {
    count: number;
    text: string;
    increment: () => void;
    setText: (text: string) => void;
  }

  let store: ReturnType<typeof createStore<TestState>>;
  let hooks: ReturnType<typeof createHooks<TestState>>;

  beforeEach(() => {
    store = createStore<TestState>({
      count: 0,
      text: '',
      increment: () => {},
      setText: () => {}
    });

    // Initialize store methods
    store.setState((state) => {
      state.increment = () => store.setState(s => ({ count: s.count + 1 }));
      state.setText = (text) => store.setState(() => ({ text }));
    });

    hooks = createHooks(store);
  });

  afterEach(() => {
    store.destroy();
    vi.clearAllMocks();
  });

  describe('useStore', () => {
    it('should return the full state and setState function', () => {
      let result: any;

      function TestComponent() {
        result = hooks.useStore();
        return null;
      }

      render(<TestComponent />);

      expect(result[0]).toEqual(expect.objectContaining({
        count: 0,
        text: ''
      }));
      expect(typeof result[1]).toBe('function');
    });

    it('should update component when state changes', async () => {
      const renderFn = vi.fn();

      function TestComponent() {
        const [state] = hooks.useStore();
        renderFn(state.count);
        return <div>{state.count}</div>;
      }

      const { getByText } = render(<TestComponent />);
      expect(renderFn).toHaveBeenLastCalledWith(0);
      expect(getByText('0')).toBeTruthy();

      act(() => {
        store.setState({ count: 5 });
      });

      expect(renderFn).toHaveBeenLastCalledWith(5);
      expect(getByText('5')).toBeTruthy();
    });

    it('should work with selector function', () => {
      let count: number;

      function TestComponent() {
        [count] = hooks.useStore(state => state.count);
        return null;
      }

      render(<TestComponent />);
      expect(count).toBe(0);

      act(() => {
        store.setState({ count: 10 });
      });

      expect(count).toBe(10);
    });

    it('should not re-render if selected state doesn\'t change', () => {
      const renderFn = vi.fn();

      function TestComponent() {
        const [text] = hooks.useStore(state => state.text);
        renderFn(text);
        return null;
      }

      render(<TestComponent />);
      expect(renderFn).toHaveBeenCalledTimes(1);

      act(() => {
        store.setState({ count: 5 }); // text didn't change
      });

      expect(renderFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('useSelector', () => {
    it('should select and subscribe to a slice of state', () => {
      let count: number;

      function TestComponent() {
        count = hooks.useSelector(state => state.count);
        return <div>{count}</div>;
      }

      const { getByText } = render(<TestComponent />);
      expect(count!).toBe(0);
      expect(getByText('0')).toBeTruthy();

      act(() => {
        store.setState({ count: 15 });
      });

      expect(count!).toBe(15);
      expect(getByText('15')).toBeTruthy();
    });
  });

  describe('useDispatch', () => {
    it('should return the setState function', () => {
      let dispatch: any;

      function TestComponent() {
        dispatch = hooks.useDispatch();
        return null;
      }

      render(<TestComponent />);
      expect(typeof dispatch).toBe('function');

      act(() => {
        dispatch({ count: 20 });
      });

      expect(store.getState().count).toBe(20);
    });

    it('should work with store methods', () => {
      function TestComponent() {
        const state = hooks.useSelector(s => s);
        const dispatch = hooks.useDispatch();

        return (
          <div>
            <div data-testid="count">{state.count}</div>
            <button onClick={() => state.increment()}>Increment</button>
            <button onClick={() => dispatch(s => s.increment())}>Dispatch Increment</button>
          </div>
        );
      }

      const { getByTestId, getByText } = render(<TestComponent />);
      expect(getByTestId('count').textContent).toBe('0');

      act(() => {
        fireEvent.click(getByText('Increment'));
      });
      expect(getByTestId('count').textContent).toBe('1');

      act(() => {
        fireEvent.click(getByText('Dispatch Increment'));
      });
      expect(getByTestId('count').textContent).toBe('2');
    });
  });
});