import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import History from './pages/History';

const Spinner = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', width:'100%' }}>
    <div style={{ width:'40px', height:'40px', borderRadius:'50%', border:'3px solid rgba(59,130,246,0.2)', borderTopColor:'#3b82f6', animation:'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

function App() {
  const { user, profile, profileChecked, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;

  const isFullScreen = ['/', '/auth', '/onboarding'].includes(location.pathname);
  const showSidebar  = user && !isFullScreen;

  // Decide where logged-in users land after /auth
  const postAuthDest = profile ? '/dashboard' : '/onboarding';

  return (
    <div className="app-container" style={{ minHeight:'100vh' }}>
      {showSidebar && <Sidebar />}
      <main className={showSidebar ? 'main-content' : 'w-full flex-center'} style={{ minHeight:'100vh' }}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to={postAuthDest} replace />} />

          {/* Onboarding — requires login */}
          <Route path="/onboarding" element={!user ? <Navigate to="/auth" replace /> : <Onboarding />} />

          {/* Protected — require login; if no profile show Dashboard anyway (profile page explains what's missing) */}
          <Route path="/dashboard" element={!user ? <Navigate to="/auth" replace /> : <Home />} />
          <Route path="/profile"   element={!user ? <Navigate to="/auth" replace /> : <Profile />} />
          <Route path="/history"   element={!user ? <Navigate to="/auth" replace /> : <History />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
