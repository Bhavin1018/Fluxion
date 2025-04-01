import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createStore } from '../store';
import { createLoggerMiddleware, createThrottleMiddleware } from '../middleware';

describe('Store', () => {
  interface TestState {
    count: number;
    name: string;
    items: string[];
  }

  const initialState: TestState = {
    count: 0,
    name: 'test',
    items: []
  };

  let store: ReturnType<typeof createStore<TestState>>;

  beforeEach(() => {
    store = createStore<TestState>(initialState);
  });

  afterEach(() => {
    store.destroy();
  });

  it('should initialize with the correct state', () => {
    expect(store.getState()).toEqual(initialState);
  });

  it('should update state correctly', () => {
    store.setState({ count: 1 });
    expect(store.getState().count).toBe(1);
    expect(store.getState().name).toBe('test');
  });

  it('should handle functional updates', () => {
    store.setState(state => ({ count: state.count + 1 }));
    expect(store.getState().count).toBe(1);
  });

  it('should handle immer-style updates', () => {
    store.setState(state => {
      state.count += 1;
      state.items.push('item1');
    });
    
    expect(store.getState().count).toBe(1);
    expect(store.getState().items).toEqual(['item1']);
  });

  it('should notify subscribers when state changes', () => {
    const listener = vi.fn();
    const subscription = store.subscribe(listener);
    
    store.setState({ count: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
    
    store.setState({ count: 2 });
    expect(listener).toHaveBeenCalledTimes(2);
    
    subscription.unsubscribe();
    store.setState({ count: 3 });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('should pass the correct states to listeners', () => {
    const listener = vi.fn();
    store.subscribe(listener);
    
    store.setState({ count: 5 });
    
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ count: 5 }),
      expect.objectContaining({ count: 0 })
    );
  });

  it('should select state correctly', () => {
    const count = store.use(state => state.count);
    expect(count).toBe(0);
    
    store.setState({ count: 10 });
    const updatedCount = store.use(state => state.count);
    expect(updatedCount).toBe(10);
  });

  it('should apply middleware correctly', () => {
    const middlewareFn = vi.fn((nextState) => nextState);
    const middleware = (nextState: TestState, prevState: TestState) => {
      middlewareFn(nextState);
      return nextState;
    };
    
    const storeWithMiddleware = createStore(initialState, {
      middleware: [middleware]
    });
    
    storeWithMiddleware.setState({ count: 5 });
    expect(middlewareFn).toHaveBeenCalledWith(expect.objectContaining({ count: 5 }));
    
    storeWithMiddleware.destroy();
  });

  it('should work with logger middleware', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    
    const storeWithLogger = createStore(initialState, {
      middleware: [createLoggerMiddleware()]
    });
    
    storeWithLogger.setState({ count: 5 });
    
    expect(consoleGroupSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleGroupEndSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
    consoleGroupSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
    storeWithLogger.destroy();
  });

  it('should work with throttle middleware', async () => {
    vi.useFakeTimers();
    
    const listener = vi.fn();
    const storeWithThrottle = createStore(initialState, {
      middleware: [createThrottleMiddleware(100)]
    });
    
    storeWithThrottle.subscribe(listener);
    
    storeWithThrottle.setState({ count: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
    
    storeWithThrottle.setState({ count: 2 });
    expect(listener).toHaveBeenCalledTimes(1);
    
    vi.advanceTimersByTime(110);
    expect(listener).toHaveBeenCalledTimes(2);
    
    vi.useRealTimers();
    storeWithThrottle.destroy();
  });
});