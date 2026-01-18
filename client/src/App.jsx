import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Splits from './pages/Splits';
import SplitDetail from './pages/SplitDetail';
import CreateSplit from './pages/CreateSplit';
import Events from './pages/Events';
import Companies from './pages/Companies';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-charcoal-500">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function RequireCompany({ children }) {
  const { hasCompany, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-charcoal-500">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (!hasCompany) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      
      {/* Auth required but no company yet */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      
      {/* Protected routes requiring company */}
      <Route
        element={
          <RequireCompany>
            <Layout />
          </RequireCompany>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/splits" element={<Splits />} />
        <Route path="/splits/new" element={<CreateSplit />} />
        <Route path="/splits/:id" element={<SplitDetail />} />
        <Route path="/events" element={<Events />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
