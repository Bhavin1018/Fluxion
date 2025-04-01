import React, { useEffect, useState } from 'react';
import {
  createStore,
  createHooks,
  createLoggerMiddleware,
  createPersistMiddleware,
  createAsyncMiddleware,
  createAsyncAction,
  createUseAsyncAction,
  createSnapshotManager,
  createSlice,
  createUseSlice,
  createSelector,
  AsyncState,
  isLoading,
  getErrors
} from '../../src';

// Define our state interface with AsyncState
interface AppState extends AsyncState {
  users: {
    list: User[];
    filter: string;
  };
  posts: {
    list: Post[];
    selectedId: number | null;
  };
  theme: {
    mode: 'light' | 'dark';
    primaryColor: string;
  };
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

// Create store with initial state and middleware
const appStore = createStore<AppState>(
  {
    // AsyncState properties will be initialized by middleware
    loading: {},
    errors: {},
    // App state
    users: {
      list: [],
      filter: ''
    },
    posts: {
      list: [],
      selectedId: null
    },
    theme: {
      mode: 'light',
      primaryColor: '#4CAF50'
    }
  },
  {
    middleware: [
      createLoggerMiddleware({ collapsed: true }),
      createPersistMiddleware('advanced-example', {
        blacklist: ['loading', 'errors']
      }),
      createAsyncMiddleware()
    ],
    devtools: true,
    name: 'Advanced Example'
  }
);

// Create hooks for the store
const { useStore, useSelector, useDispatch } = createHooks(appStore);

// Create custom hooks for async actions
const useAsyncAction = createUseAsyncAction<AppState>(useDispatch);

// Create custom hook for slices
const useSlice = createUseSlice<AppState>(useStore);

// Create snapshot manager for time-travel debugging
const snapshotManager = createSnapshotManager(appStore, {
  maxSnapshots: 50,
  autoSnapshot: true,
  autoSnapshotInterval: 10000
});

// Create slices for different parts of the state
const usersSlice = createSlice(appStore, 'users');
const postsSlice = createSlice(appStore, 'posts');
const themeSlice = createSlice(appStore, 'theme');

// Create memoized selectors
const selectFilteredUsers = createSelector<AppState, User[]>(
  (state) => {
    const { list, filter } = state.users;
    if (!filter) return list;
    return list.filter(user => 
      user.name.toLowerCase().includes(filter.toLowerCase()) ||
      user.email.toLowerCase().includes(filter.toLowerCase())
    );
  },
  { deps: [] }
);

const selectSelectedPost = createSelector<AppState, Post | undefined>(
  (state) => {
    const { list, selectedId } = state.posts;
    if (selectedId === null) return undefined;
    return list.find(post => post.id === selectedId);
  },
  { deps: [] }
);

// API functions
const fetchUsers = async (): Promise<User[]> => {
  const response = await fetch('https://jsonplaceholder.typicode.com/users');
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

const fetchPosts = async (): Promise<Post[]> => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts');
  if (!response.ok) throw new Error('Failed to fetch posts');
  return response.json();
};

// User List Component
function UserList() {
  const asyncAction = useAsyncAction();
  const users = useSelector(selectFilteredUsers);
  const [userFilter, setUserFilter] = useSlice('users');
  const loading = useSelector(state => isLoading(state, ['fetchUsers']));
  const errors = useSelector(state => getErrors(state, ['fetchUsers']));
  
  const handleFetchUsers = () => {
    asyncAction(
      () => fetchUsers(),
      {
        actionName: 'fetchUsers',
        onSuccess: (users) => {
          usersSlice.setSlice({ list: users });
        }
      }
    );
  };
  
  useEffect(() => {
    handleFetchUsers();
  }, []);
  
  return (
    <div className="panel">
      <h2>Users</h2>
      <div className="filter">
        <input
          type="text"
          placeholder="Filter users..."
          value={userFilter.filter}
          onChange={(e) => setUserFilter({ filter: e.target.value })}
        />
      </div>
      
      {loading && <div className="loading">Loading users...</div>}
      {errors.fetchUsers && <div className="error">{errors.fetchUsers.message}</div>}
      
      <ul className="list">
        {users.map(user => (
          <li key={user.id}>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </li>
        ))}
      </ul>
      
      <button onClick={handleFetchUsers} disabled={loading}>Refresh Users</button>
    </div>
  );
}

// Post List Component
function PostList() {
  const asyncAction = useAsyncAction();
  const posts = useSelector(state => state.posts.list);
  const selectedPost = useSelector(selectSelectedPost);
  const dispatch = useDispatch();
  const loading = useSelector(state => isLoading(state, ['fetchPosts']));
  const errors = useSelector(state => getErrors(state, ['fetchPosts']));
  
  const handleFetchPosts = () => {
    asyncAction(
      () => fetchPosts(),
      {
        actionName: 'fetchPosts',
        onSuccess: (posts) => {
          postsSlice.setSlice({ list: posts });
        }
      }
    );
  };
  
  const handleSelectPost = (id: number) => {
    postsSlice.setSlice({ selectedId: id });
  };
  
  useEffect(() => {
    handleFetchPosts();
  }, []);
  
  return (
    <div className="panel">
      <h2>Posts</h2>
      
      {loading && <div className="loading">Loading posts...</div>}
      {errors.fetchPosts && <div className="error">{errors.fetchPosts.message}</div>}
      
      <div className="post-container">
        <ul className="list post-list">
          {posts.slice(0, 10).map(post => (
            <li 
              key={post.id} 
              className={post.id === selectedPost?.id ? 'selected' : ''}
              onClick={() => handleSelectPost(post.id)}
            >
              <strong>{post.title}</strong>
            </li>
          ))}
        </ul>
        
        {selectedPost && (
          <div className="post-detail">
            <h3>{selectedPost.title}</h3>
            <p>{selectedPost.body}</p>
          </div>
        )}
      </div>
      
      <button onClick={handleFetchPosts} disabled={loading}>Refresh Posts</button>
    </div>
  );
}

// Theme Switcher Component
function ThemeSwitcher() {
  const [theme, setTheme] = useSlice('theme');
  
  const toggleTheme = () => {
    setTheme({ mode: theme.mode === 'light' ? 'dark' : 'light' });
  };
  
  const changeColor = (color: string) => {
    setTheme({ primaryColor: color });
  };
  
  return (
    <div className="theme-switcher">
      <button onClick={toggleTheme}>
        Switch to {theme.mode === 'light' ? 'Dark' : 'Light'} Mode
      </button>
      
      <div className="color-picker">
        <div 
          className={`color-option ${theme.primaryColor === '#4CAF50' ? 'selected' : ''}`}
          style={{ backgroundColor: '#4CAF50' }}
          onClick={() => changeColor('#4CAF50')}
        />
        <div 
          className={`color-option ${theme.primaryColor === '#2196F3' ? 'selected' : ''}`}
          style={{ backgroundColor: '#2196F3' }}
          onClick={() => changeColor('#2196F3')}
        />
        <div 
          className={`color-option ${theme.primaryColor === '#FF5722' ? 'selected' : ''}`}
          style={{ backgroundColor: '#FF5722' }}
          onClick={() => changeColor('#FF5722')}
        />
      </div>
    </div>
  );
}

// Time Travel Debug Component
function TimeTravel() {
  const [snapshots, setSnapshots] = useState(snapshotManager.getSnapshots());
  
  const handleTakeSnapshot = () => {
    snapshotManager.takeSnapshot('Manual snapshot');
    setSnapshots([...snapshotManager.getSnapshots()]);
  };
  
  const handleUndo = () => {
    snapshotManager.undo();
    setSnapshots([...snapshotManager.getSnapshots()]);
  };
  
  const handleRedo = () => {
    snapshotManager.redo();
    setSnapshots([...snapshotManager.getSnapshots()]);
  };
  
  const handleApplySnapshot = (index: number) => {
    snapshotManager.applySnapshot(index);
    setSnapshots([...snapshotManager.getSnapshots()]);
  };
  
  return (
    <div className="time-travel">
      <h2>Time Travel Debugging</h2>
      
      <div className="controls">
        <button onClick={handleTakeSnapshot}>Take Snapshot</button>
        <button onClick={handleUndo} disabled={!snapshotManager.canUndo()}>Undo</button>
        <button onClick={handleRedo} disabled={!snapshotManager.canRedo()}>Redo</button>
      </div>
      
      <div className="snapshots">
        <h3>Snapshots ({snapshots.length})</h3>
        <ul>
          {snapshots.map((snapshot, index) => (
            <li key={snapshot.timestamp} onClick={() => handleApplySnapshot(index)}>
              {new Date(snapshot.timestamp).toLocaleTimeString()} - 
              {snapshot.description || `Snapshot ${index + 1}`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Main App Component
export function App() {
  const [theme] = useSlice('theme');
  
  // Apply theme to the app
  useEffect(() => {
    document.body.className = theme.mode;
    document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
  }, [theme.mode, theme.primaryColor]);
  
  return (
    <div className={`app ${theme.mode}`}>
      <header>
        <h1>ReactFlow Advanced Example</h1>
        <ThemeSwitcher />
      </header>
      
      <main>
        <div className="content">
          <div className="data-panels">
            <UserList />
            <PostList />
          </div>
          <TimeTravel />
        </div>
      </main>
      
      <footer>
        <p>
          This example demonstrates advanced features of ReactFlow:
          <ul>
            <li>Async actions with loading states</li>
            <li>State slicing for better organization</li>
            <li>Memoized selectors for performance</li>
            <li>Time-travel debugging with snapshots</li>
            <li>Persistence with localStorage</li>
          </ul>
        </p>
      </footer>
    </div>
  );
}