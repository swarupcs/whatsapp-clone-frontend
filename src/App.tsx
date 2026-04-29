import { clearAuth } from '@/store/slices/authSlice';
import { setToken } from '@/store/slices/chatSlice';
import { useAppSelector, useAppDispatch } from '@/store';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { SocketProvider } from '@/context/SocketContext';
import { useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});

function TokenSync() {
  const dispatch = useAppDispatch();
  const authToken = useAppSelector((state) => state.auth.token);
  useEffect(() => {
    dispatch(setToken(authToken));
  }, [authToken, dispatch]);
  return null;
}

// Listen for session-expiry event dispatched by axios interceptor
function AuthExpiredListener() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const handle = () => {
      dispatch(clearAuth());
      queryClient.clear();    };
    window.addEventListener('auth:expired', handle);
    return () => window.removeEventListener('auth:expired', handle);
  }, [clearAuth]);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAppSelector((state) => state.auth.token);
  return token ? <>{children}</> : <Navigate to='/login' replace />;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const token = useAppSelector((state) => state.auth.token);
  return token ? <Navigate to='/' replace /> : <>{children}</>;
}

function ThemeInit() {
  // This hook sets the theme class on html root element
  useTheme();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SocketProvider>
      <TooltipProvider>
        <ThemeInit />
        <Toaster
          position='top-right'
          theme='system'
          toastOptions={{
            style: {
              background: 'var(--card)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-sans)',
            },
          }}
        />
        <BrowserRouter>
          <TokenSync />
          <AuthExpiredListener />
          <Routes>
            <Route
              path='/'
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path='/login'
              element={
                <AuthRoute>
                  <Login />
                </AuthRoute>
              }
            />
            <Route
              path='/register'
              element={
                <AuthRoute>
                  <Register />
                </AuthRoute>
              }
            />
            <Route
              path='/profile'
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path='/settings'
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path='*' element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SocketProvider>
  </QueryClientProvider>
);

export default App;
