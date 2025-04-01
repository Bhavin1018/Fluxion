# Migration Guide

## Migrating from Zustand to ReactFlow

This guide will help you migrate your application from Zustand to ReactFlow. ReactFlow builds upon the simplicity of Zustand while offering enhanced features and improved performance.

### Basic Store Migration

#### Zustand Store

```tsx
// Zustand
import create from 'zustand'

interface BearState {
  bears: number
  increase: (by: number) => void
}

const useBearStore = create<BearState>((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}))
```

#### ReactFlow Store

```tsx
// ReactFlow
import { createStore, createHooks } from 'reactflow'

interface BearState {
  bears: number
  increase: (by: number) => void
}

const bearStore = createStore<BearState>({
  bears: 0,
  increase: () => {}, // Placeholder, will be initialized below
})

// Initialize methods
bearStore.setState((state) => {
  state.increase = (by) => bearStore.setState(s => ({ bears: s.bears + by }))
})

// Create hooks for the store
const { useStore, useSelector } = createHooks(bearStore)
```

### Using the Store in Components

#### Zustand

```tsx
// Zustand
function BearCounter() {
  const bears = useBearStore((state) => state.bears)
  const increase = useBearStore((state) => state.increase)
  
  return (
    <>
      <h1>{bears} around here...</h1>
      <button onClick={() => increase(1)}>Add a bear</button>
    </>
  )
}
```

#### ReactFlow

```tsx
// ReactFlow
function BearCounter() {
  // Option 1: Use selectors for individual pieces of state
  const bears = useSelector(state => state.bears)
  const increase = useSelector(state => state.increase)
  
  // Option 2: Use the full store
  // const [state] = useStore()
  // const { bears, increase } = state
  
  return (
    <>
      <h1>{bears} around here...</h1>
      <button onClick={() => increase(1)}>Add a bear</button>
    </>
  )
}
```

### Middleware Migration

#### Zustand

```tsx
// Zustand
import create from 'zustand'
import { persist } from 'zustand/middleware'

const usePersistStore = create(
  persist(
    (set) => ({
      fishes: 0,
      addAFish: () => set((state) => ({ fishes: state.fishes + 1 })),
    }),
    { name: 'food-storage' }
  )
)
```

#### ReactFlow

```tsx
// ReactFlow
import { createStore, createHooks, createPersistMiddleware } from 'reactflow'

const fishStore = createStore(
  {
    fishes: 0,
    addAFish: () => {},
  },
  {
    middleware: [createPersistMiddleware('food-storage')],
  }
)

// Initialize methods
fishStore.setState((state) => {
  state.addAFish = () => fishStore.setState(s => ({ fishes: s.fishes + 1 }))
})

const { useStore } = createHooks(fishStore)
```

### Async Actions

#### Zustand

```tsx
// Zustand
import create from 'zustand'

interface UserState {
  users: User[]
  loading: boolean
  error: Error | null
  fetchUsers: () => Promise<void>
}

const useUserStore = create<UserState>((set) => ({
  users: [],
  loading: false,
  error: null,
  fetchUsers: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/users')
      const users = await response.json()
      set({ users, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },
}))
```

#### ReactFlow

```tsx
// ReactFlow
import { createStore, createHooks, createAsyncMiddleware, createUseAsyncAction, isLoading, getErrors } from 'reactflow'

interface UserState {
  users: User[]
}

const userStore = createStore<UserState & AsyncState>(
  {
    users: [],
    // AsyncState properties will be initialized by middleware
    loading: {},
    errors: {},
  },
  {
    middleware: [createAsyncMiddleware()],
  }
)

const { useStore, useSelector, useDispatch } = createHooks(userStore)
const useAsyncAction = createUseAsyncAction(useDispatch)

function UserComponent() {
  const asyncAction = useAsyncAction()
  const loading = useSelector(state => isLoading(state, ['fetchUsers']))
  const errors = useSelector(state => getErrors(state, ['fetchUsers']))
  const users = useSelector(state => state.users)
  
  const fetchUsers = () => {
    asyncAction(
      () => fetch('/api/users').then(r => r.json()),
      {
        actionName: 'fetchUsers',
        onSuccess: (users) => {
          userStore.setState({ users })
        }
      }
    )
  }
  
  return (
    <div>
      {loading && <p>Loading...</p>}
      {errors.fetchUsers && <p>Error: {errors.fetchUsers.message}</p>}
      <button onClick={fetchUsers}>Fetch Users</button>
      <ul>
        {users.map(user => <li key={user.id}>{user.name}</li>)}
      </ul>
    </div>
  )
}
```

### Slices (Equivalent to Zustand's Context)

#### Zustand

```tsx
// Zustand
import create from 'zustand'

interface BearSlice {
  bears: number
  addBear: () => void
}

interface FishSlice {
  fishes: number
  addFish: () => void
}

const useBoundStore = create<BearSlice & FishSlice>()((set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
  fishes: 0,
  addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
}))
```

#### ReactFlow

```tsx
// ReactFlow
import { createStore, createHooks, createSlice, createUseSlice } from 'reactflow'

interface AppState {
  bears: { count: number }
  fishes: { count: number }
}

const store = createStore<AppState>({
  bears: { count: 0 },
  fishes: { count: 0 }
})

// Create slices
const bearsSlice = createSlice(store, 'bears')
const fishesSlice = createSlice(store, 'fishes')

// Use in components with custom hook
const { useStore } = createHooks(store)
const useSlice = createUseSlice(useStore)

function BearCounter() {
  const [bears, setBears] = useSlice('bears')
  
  return (
    <>
      <h1>{bears.count} bears around here...</h1>
      <button onClick={() => setBears({ count: bears.count + 1 })}>Add a bear</button>
    </>
  )
}

function FishCounter() {
  const [fishes, setFishes] = useSlice('fishes')
  
  return (
    <>
      <h1>{fishes.count} fishes swimming around...</h1>
      <button onClick={() => setFishes({ count: fishes.count + 1 })}>Add a fish</button>
    </>
  )
}
```

## Migrating from Redux to ReactFlow

This guide will help you migrate your application from Redux to ReactFlow. ReactFlow offers a simpler API with less boilerplate while maintaining powerful features.

### Basic Store Migration

#### Redux

```tsx
// Redux
import { createStore } from 'redux'

// Action types
const INCREMENT = 'INCREMENT'
const DECREMENT = 'DECREMENT'

// Action creators
const increment = () => ({ type: INCREMENT })
const decrement = () => ({ type: DECREMENT })

// Reducer
const counterReducer = (state = { count: 0 }, action) => {
  switch (action.type) {
    case INCREMENT:
      return { count: state.count + 1 }
    case DECREMENT:
      return { count: state.count - 1 }
    default:
      return state
  }
}

// Store
const store = createStore(counterReducer)
```

#### ReactFlow

```tsx
// ReactFlow
import { createStore, createHooks } from 'reactflow'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
}

const counterStore = createStore<CounterState>({
  count: 0,
  increment: () => {},
  decrement: () => {}
})

// Initialize methods
counterStore.setState((state) => {
  state.increment = () => counterStore.setState(s => ({ count: s.count + 1 }))
  state.decrement = () => counterStore.setState(s => ({ count: s.count - 1 }))
})

// Create hooks for the store
const { useStore, useSelector } = createHooks(counterStore)
```

### Using the Store in Components

#### Redux with React-Redux

```tsx
// Redux with React-Redux
import { useSelector, useDispatch } from 'react-redux'
import { increment, decrement } from './actions'

function Counter() {
  const count = useSelector(state => state.count)
  const dispatch = useDispatch()
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => dispatch(decrement())}>-</button>
      <button onClick={() => dispatch(increment())}>+</button>
    </div>
  )
}
```

#### ReactFlow

```tsx
// ReactFlow
function Counter() {
  const count = useSelector(state => state.count)
  const { increment, decrement } = useSelector(state => ({
    increment: state.increment,
    decrement: state.decrement
  }))
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={decrement}>-</button>
      <button onClick={increment}>+</button>
    </div>
  )
}
```

### Middleware and Async Actions

#### Redux with Redux Thunk

```tsx
// Redux with Redux Thunk
import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

// Action types
const FETCH_USERS_REQUEST = 'FETCH_USERS_REQUEST'
const FETCH_USERS_SUCCESS = 'FETCH_USERS_SUCCESS'
const FETCH_USERS_FAILURE = 'FETCH_USERS_FAILURE'

// Action creators
const fetchUsersRequest = () => ({ type: FETCH_USERS_REQUEST })
const fetchUsersSuccess = users => ({ type: FETCH_USERS_SUCCESS, payload: users })
const fetchUsersFailure = error => ({ type: FETCH_USERS_FAILURE, payload: error })

// Async action creator
const fetchUsers = () => {
  return async dispatch => {
    dispatch(fetchUsersRequest())
    try {
      const response = await fetch('/api/users')
      const users = await response.json()
      dispatch(fetchUsersSuccess(users))
    } catch (error) {
      dispatch(fetchUsersFailure(error.message))
    }
  }
}

// Reducer
const initialState = {
  users: [],
  loading: false,
  error: null
}

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_USERS_REQUEST:
      return { ...state, loading: true, error: null }
    case FETCH_USERS_SUCCESS:
      return { ...state, loading: false, users: action.payload }
    case FETCH_USERS_FAILURE:
      return { ...state, loading: false, error: action.payload }
    default:
      return state
  }
}

// Store with middleware
const store = createStore(userReducer, applyMiddleware(thunk))
```

#### ReactFlow

```tsx
// ReactFlow
import { createStore, createHooks, createAsyncMiddleware, createUseAsyncAction, isLoading, getErrors } from 'reactflow'

interface UserState {
  users: User[]
}

const userStore = createStore<UserState & AsyncState>(
  {
    users: [],
    // AsyncState properties will be initialized by middleware
    loading: {},
    errors: {}
  },
  {
    middleware: [createAsyncMiddleware()],
    devtools: true
  }
)

const { useSelector, useDispatch } = createHooks(userStore)
const useAsyncAction = createUseAsyncAction(useDispatch)

function UserComponent() {
  const asyncAction = useAsyncAction()
  const loading = useSelector(state => isLoading(state, ['fetchUsers']))
  const error = useSelector(state => getErrors(state, ['fetchUsers'])?.fetchUsers)
  const users = useSelector(state => state.users)
  
  const fetchUsers = () => {
    asyncAction(
      () => fetch('/api/users').then(r => r.json()),
      {
        actionName: 'fetchUsers',
        onSuccess: (users) => {
          userStore.setState({ users })
        }
      }
    )
  }
  
  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      <button onClick={fetchUsers}>Fetch Users</button>
      <ul>
        {users.map(user => <li key={user.id}>{user.name}</li>)}
      </ul>
    </div>
  )
}
```

## Migrating from Nano Stores to ReactFlow

This guide will help you migrate your application from Nano Stores to ReactFlow. ReactFlow provides a more comprehensive API while maintaining the lightweight nature of Nano Stores.

### Basic Store Migration

#### Nano Stores

```tsx
// Nano Stores
import { atom } from 'nanostores'

// Create a simple atom store
const $counter = atom(0)

// Update the store
function increment() {
  $counter.set($counter.get() + 1)
}

function decrement() {
  $counter.set($counter.get() - 1)
}
```

#### ReactFlow

```tsx
// ReactFlow
import { createStore, createHooks } from 'reactflow'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
}

const counterStore = createStore<CounterState>({
  count: 0,
  increment: () => {},
  decrement: () => {}
})

// Initialize methods
counterStore.setState((state) => {
  state.increment = () => counterStore.setState(s => ({ count: s.count + 1 }))
  state.decrement = () => counterStore.setState(s => ({ count: s.count - 1 }))
})

// Create hooks for the store
const { useStore, useSelector } = createHooks(counterStore)
```

### Using the Store in Components

#### Nano Stores with React

```tsx
// Nano Stores with React
import { useStore } from '@nanostores/react'
import { $counter, increment, decrement } from './store'

function Counter() {
  const count = useStore($counter)
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={decrement}>-</button>
      <button onClick={increment}>+</button>
    </div>
  )
}
```

#### ReactFlow

```tsx
// ReactFlow
function Counter() {
  const count = useSelector(state => state.count)
  const { increment, decrement } = useSelector(state => ({
    increment: state.increment,
    decrement: state.decrement
  }))
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={decrement}>-</button>
      <button onClick={increment}>+</button>
    </div>
  )
}
```

### Object Stores Migration

#### Nano Stores

```tsx
// Nano Stores
import { map } from 'nanostores'

interface User {
  id: number
  name: string
}

// Create a map store
const $users = map<Record<number, User>>({})

// Add a user
function addUser(user: User) {
  $users.setKey(user.id, user)
}

// Remove a user
function removeUser(id: number) {
  $users.setKey(id, undefined)
}
```

#### ReactFlow

```tsx
// ReactFlow
import { createStore, createHooks } from 'reactflow'

interface User {
  id: number
  name: string
}

interface UsersState {
  users: Record<number, User>
  addUser: (user: User) => void
  removeUser: (id: number) => void
}

const usersStore = createStore<UsersState>({
  users: {},
  addUser: () => {},
  removeUser: () => {}
})

// Initialize methods
usersStore.setState((state) => {
  state.addUser = (user) => usersStore.setState(s => ({
    users: { ...s.users, [user.id]: user }
  }))
  
  state.removeUser = (id) => usersStore.setState(s => {
    const newUsers = { ...s.users }
    delete newUsers[id]
    return { users: newUsers }
  })
})

const { useStore, useSelector } = createHooks(usersStore)
```

### Computed Values Migration

#### Nano Stores

```tsx
// Nano Stores
import { atom, computed } from 'nanostores'

const $firstName = atom('John')
const $lastName = atom('Doe')

// Create a computed store
const $fullName = computed([$firstName, $lastName], 
  (firstName, lastName) => `${firstName} ${lastName}`
)
```

#### ReactFlow

```tsx
// ReactFlow
import { createStore, createHooks, createSelector } from 'reactflow'

interface NameState {
  firstName: string
  lastName: string
  setFirstName: (name: string) => void
  setLastName: (name: string) => void
}

const nameStore = createStore<NameState>({
  firstName: 'John',
  lastName: 'Doe',
  setFirstName: () => {},
  setLastName: () => {}
})

// Initialize methods
nameStore.setState((state) => {
  state.setFirstName = (name) => nameStore.setState({ firstName: name })
  state.setLastName = (name) => nameStore.setState({ lastName: name })
})

const { useStore, useSelector } = createHooks(nameStore)

// Create a selector for computed value
const useFullName = () => useSelector(
  createSelector(
    state => state.firstName,
    state => state.lastName,
    (firstName, lastName) => `${firstName} ${lastName}`
  )
)
```

### Async Actions

#### Nano Stores

```tsx
// Nano Stores
import { atom } from 'nanostores'

interface User {
  id: number
  name: string
}

const $users = atom<User[]>([])
const $loading = atom(false)
const $error = atom<Error | null>(null)

async function fetchUsers() {
  $loading.set(true)
  $error.set(null)
  
  try {
    const response = await fetch('/api/users')
    if (!response.ok) throw new Error('Failed to fetch users')
    const users = await response.json()
    $users.set(users)
  } catch (error) {
    $error.set(error as Error)
  } finally {
    $loading.set(false)
  }
}
```

#### ReactFlow

```tsx
// ReactFlow
import { createStore, createHooks, createAsyncMiddleware, createUseAsyncAction, isLoading, getErrors } from 'reactflow'

interface User {
  id: number
  name: string
}

interface UserState {
  users: User[]
}

const userStore = createStore<UserState & AsyncState>(
  {
    users: [],
    // AsyncState properties will be initialized by middleware
    loading: {},
    errors: {}
  },
  {
    middleware: [createAsyncMiddleware()]
  }
)

const { useSelector, useDispatch } = createHooks(userStore)
const useAsyncAction = createUseAsyncAction(useDispatch)

function UserComponent() {
  const asyncAction = useAsyncAction()
  const loading = useSelector(state => isLoading(state, ['fetchUsers']))
  const error = useSelector(state => getErrors(state, ['fetchUsers'])?.fetchUsers)
  const users = useSelector(state => state.users)
  
  const fetchUsers = () => {
    asyncAction(
      () => fetch('/api/users').then(r => r.json()),
      {
        actionName: 'fetchUsers',
        onSuccess: (users) => {
          userStore.setState({ users })
        }
      }
    )
  }
  
  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      <button onClick={fetchUsers}>Fetch Users</button>
      <ul>
        {users.map(user => <li key={user.id}>{user.name}</li>)}
      </ul>
    </div>
  )
}
```

## Feature Comparison

| Feature | Zustand | Redux | Nano Stores | ReactFlow |
|---------|---------|-------|-------------|----------|
| Boilerplate | Low | High | Very Low | Very Low |
| TypeScript Support | Good | Good with Redux Toolkit | Good | Excellent |
| Middleware | Limited | Extensive | Limited | Built-in, Extensible |
| DevTools | Basic | Excellent | Limited | Enhanced |
| Async Actions | Manual | Requires Redux Thunk/Saga | Manual | Built-in |
| Selectors | Basic | Requires Reselect | Via computed | Advanced with Auto-Memoization |
| Persistence | Via middleware | Via redux-persist | Manual | Enhanced built-in |
| State Organization | Flat | Reducers | Atoms/Maps | Slices |
| Bundle Size | Small | Large | Very Small | Small |
| Learning Curve | Low | High | Low | Low |
| Time-Travel Debugging | No | Yes | No | Yes |
| Vanilla JS Support | Yes | Yes | Yes | Yes |

This migration guide covers the most common use cases, but ReactFlow offers many more features and optimizations. Check the main documentation for more detailed information on specific features.