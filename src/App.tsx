import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { SocketProvider } from '@/context/SocketContext';
import { useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Sync auth token from authStore → chatStore.token so ProtectedRoute works
function TokenSync() {
  const authToken = useAuthStore((s) => s.token);
  const setToken = useChatStore((s) => s.setToken);
  useEffect(() => { setToken(authToken); }, [authToken, setToken]);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to='/login' replace />;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <Navigate to='/' replace /> : <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SocketProvider>
      <TooltipProvider>
        <Toaster position='top-center' theme='dark' />
        <BrowserRouter>
          <TokenSync />
          <div className='dark'>
            <Routes>
              <Route path='/' element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path='/login' element={<AuthRoute><Login /></AuthRoute>} />
              <Route path='/register' element={<AuthRoute><Register /></AuthRoute>} />
              <Route path='/profile' element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path='/settings' element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path='*' element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </SocketProvider>
  </QueryClientProvider>
);

export default App;
