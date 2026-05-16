import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, User, Clock, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const navLinkStyle = (isActive) => ({
  padding: '0.85rem 1rem',
  borderRadius: '8px',
  textDecoration: 'none',
  color: isActive ? 'white' : 'var(--text-secondary)',
  background: isActive ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))' : 'transparent',
  border: isActive ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
  display: 'flex',
  alignItems: 'center',
  gap: '0.85rem',
  transition: 'all 0.2s',
  fontWeight: isActive ? 600 : 400,
  fontSize: '0.95rem',
});

const Sidebar = () => {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const displayName = profile?.profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const close = () => setOpen(false);

  const handleNav = (to) => { close(); navigate(to); };

  return (
    <>
      {/* ── Hamburger toggle (mobile only) ── */}
      <button className="sidebar-toggle" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* ── Dark overlay (mobile only) ── */}
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={close} />

      {/* ── Sidebar panel ── */}
      <aside className={`sidebar glass-panel ${open ? 'open' : ''}`}
        style={{ borderRadius:0, borderTop:'none', borderBottom:'none', borderLeft:'none' }}>

        {/* Logo + close on mobile */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2.5rem', paddingBottom:'1.5rem', borderBottom:'1px solid var(--border-color)' }}>
          <Logo size={36} textSize="1.4rem" />
          <button onClick={close} aria-label="Close menu"
            style={{ background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer', padding:'0.25rem', display:'none' }}
            className="sidebar-close-btn">
            <X size={18}/>
          </button>
        </div>

        {/* Nav Links */}
        <nav style={{ display:'flex', flexDirection:'column', gap:'0.4rem', flex:1 }}>
          {[
            { to:'/dashboard', icon:Search,  label:'Analyzer' },
            { to:'/history',   icon:Clock,   label:'History'  },
            { to:'/profile',   icon:User,    label:'Profile'  },
          ].map(({ to, icon:Icon, label }) => (
            <NavLink key={to} to={to} onClick={close} style={({ isActive }) => navLinkStyle(isActive)}>
              <Icon size={19}/> {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ marginTop:'auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'1rem', background:'rgba(0,0,0,0.2)', borderRadius:'10px', marginBottom:'0.75rem' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.9rem', flexShrink:0 }}>
              {initials}
            </div>
            <div style={{ flex:1, overflow:'hidden' }}>
              <div style={{ fontSize:'0.9rem', fontWeight:600, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{displayName}</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={signOut} className="btn btn-secondary"
            style={{ width:'100%', justifyContent:'center', gap:'0.5rem', fontSize:'0.9rem', padding:'0.7rem' }}>
            <LogOut size={16}/> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile close button visible inside sidebar via CSS */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-close-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
