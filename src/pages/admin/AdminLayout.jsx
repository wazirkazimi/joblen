import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LineChart, MessageSquare, Settings, LogOut, Menu, X, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Logo from '../../components/Logo';
import './admin.css';

export default function AdminLayout() {
  const [authorized, setAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSavedPassword = async () => {
      const savedPass = sessionStorage.getItem('joblens_admin_pass') || localStorage.getItem('joblens_admin_pass');
      if (savedPass) {
        try {
          const { data, error: rpcError } = await supabase.rpc('admin_verify_password', { admin_pass: savedPass });
          if (!rpcError && data === true) {
            setAuthorized(true);
          } else {
            sessionStorage.removeItem('joblens_admin_pass');
            localStorage.removeItem('joblens_admin_pass');
          }
        } catch (err) {
          console.error('Verify saved admin password failed:', err);
        }
      }
      setChecking(false);
    };

    checkSavedPassword();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!passwordInput.trim()) {
      setError('Password is required');
      return;
    }

    try {
      const { data, error: rpcError } = await supabase.rpc('admin_verify_password', { admin_pass: passwordInput });
      if (rpcError) {
        setError(rpcError.message || 'Verification failed. Database error.');
        return;
      }

      if (data === true) {
        setAuthorized(true);
        sessionStorage.setItem('joblens_admin_pass', passwordInput);
        // Also save to localStorage so the session persists if the user checks 'Remember Me'
        localStorage.setItem('joblens_admin_pass', passwordInput);
      } else {
        setError('Incorrect admin password');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Is the database online?');
    }
  };

  const handleSignOut = () => {
    sessionStorage.removeItem('joblens_admin_pass');
    localStorage.removeItem('joblens_admin_pass');
    setAuthorized(false);
    navigate('/');
  };

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', background: 'var(--bg-dark)' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: 'var(--accent-primary)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Password Gate
  if (!authorized) {
    return (
      <div className="admin-gate-overlay">
        <div className="admin-gate-card glass-panel">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Logo size={48} showText={false} />
          </div>
          <h2 style={{ marginBottom: '0.5rem', background: 'linear-gradient(135deg, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            JobLens Admin
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Please authenticate using the admin password.
          </p>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input
                type="password"
                className="input-field"
                placeholder="Enter admin password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={{ textAlign: 'center' }}
                autoFocus
              />
            </div>
            {error && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: 500 }}>
                ⚠️ {error}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary w-full" onClick={() => navigate('/')}>
                Back to Site
              </button>
              <button type="submit" className="btn btn-primary w-full">
                Verify
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/analyses', label: 'Analyses', icon: LineChart },
    { path: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/system', label: 'System', icon: Settings },
  ];

  return (
    <div className="admin-layout">
      {/* Mobile Header / Hamburger Toggle */}
      <button className="admin-hamburger" onClick={() => setSidebarOpen(prev => !prev)} aria-label="Toggle admin sidebar">
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar navigation */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-logo">
          <Logo size={32} showText={false} />
          <span style={{ fontWeight: 700, fontSize: '1.2rem', background: 'linear-gradient(135deg, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            JobLens Admin
          </span>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="btn btn-secondary w-full" onClick={handleSignOut} style={{ gap: '0.5rem', fontSize: '0.9rem', padding: '0.6rem' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main page content area */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
