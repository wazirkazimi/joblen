import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import History from './pages/History';

// Admin Components
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalyses from './pages/admin/AdminAnalyses';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSystem from './pages/admin/AdminSystem';

const Spinner = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', width:'100%' }}>
    <div style={{ width:'40px', height:'40px', borderRadius:'50%', border:'3px solid rgba(59,130,246,0.2)', borderTopColor:'#3b82f6', animation:'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

function App() {
  const { user, profile, profileChecked, loading } = useAuth();
  const location = useLocation();
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('value')
          .eq('key', 'maintenance_mode')
          .maybeSingle();
        if (!error && data?.value === 'true') {
          setMaintenanceMode(true);
        } else {
          setMaintenanceMode(false);
        }
      } catch (_) {
        // Safe check
      }
    };
    checkMaintenance();

    // Check again every 30 seconds for live updates
    const interval = setInterval(checkMaintenance, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Spinner />;

  const isAdmin = location.pathname.startsWith('/admin');
  const isFullScreen = ['/', '/auth', '/onboarding'].includes(location.pathname) || isAdmin;
  const showSidebar  = user && !isFullScreen;

  // Decide where logged-in users land after /auth
  const postAuthDest = profile ? '/dashboard' : '/onboarding';

  return (
    <div className="app-container" style={{ minHeight:'100vh', flexDirection: showSidebar ? 'row' : 'column' }}>
      {/* System Maintenance Mode Banner */}
      {maintenanceMode && !isAdmin && (
        <div style={{
          background: 'linear-gradient(90deg, #b45309, #d97706)',
          color: '#fff',
          padding: '0.6rem 1.2rem',
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '0.85rem',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
          position: 'fixed',
          top: 0,
          left: 0
        }}>
          <span>⚠️ System Maintenance Mode is currently Active. Some services may be restricted.</span>
        </div>
      )}

      {showSidebar && <Sidebar />}
      
      <main 
        className={showSidebar ? 'main-content' : 'w-full flex-center'} 
        style={{ 
          minHeight:'100vh', 
          paddingTop: (maintenanceMode && !isAdmin) ? '3rem' : showSidebar ? '2rem' : '0'
        }}
      >
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to={postAuthDest} replace />} />

          {/* Onboarding - requires login */}
          <Route path="/onboarding" element={!user ? <Navigate to="/auth" replace /> : <Onboarding />} />

          {/* Protected - require login; if no profile show Dashboard anyway (profile page explains what's missing) */}
          <Route path="/dashboard" element={!user ? <Navigate to="/auth" replace /> : <Home />} />
          <Route path="/profile"   element={!user ? <Navigate to="/auth" replace /> : <Profile />} />
          <Route path="/history"   element={!user ? <Navigate to="/auth" replace /> : <History />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="analyses" element={<AdminAnalyses />} />
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="system" element={<AdminSystem />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
