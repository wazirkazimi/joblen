import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const destination = user ? (profile ? '/dashboard' : '/onboarding') : '/auth';

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{ padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="score-circle score-high" style={{ width: '36px', height: '36px', fontSize: '1rem', borderWidth: '3px' }}>JL</div>
          <h2 style={{ marginBottom: 0, fontSize: '1.5rem' }}>JobLens</h2>
        </div>
        <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
          {!user ? (
            <>
              <button className="btn btn-secondary" style={{padding:'0.6rem 1.25rem',fontSize:'0.95rem'}} onClick={() => navigate('/auth')}>
                Log In
              </button>
              <button className="btn btn-primary" style={{padding:'0.6rem 1.25rem',fontSize:'0.95rem'}} onClick={() => navigate('/auth')}>
                Sign Up Free <ArrowRight size={16}/>
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate(destination)}>
              {profile ? 'Dashboard' : 'Complete Profile'} <ArrowRight size={18}/>
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 2rem' }}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ maxWidth: '800px' }}
        >
          <div className="badge badge-primary mb-6" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', padding: '0.5rem 1rem' }}>
            🚀 The Ultimate AI Career Advisor
          </div>
          
          <h1 style={{ fontSize: '4.5rem', lineHeight: 1.1, marginBottom: '1.5rem' }}>
            Stop guessing.<br />Start <span style={{ color: 'var(--accent-primary)' }}>landing interviews.</span>
          </h1>
          
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
            Paste any LinkedIn job post. We analyze your fit, spot red flags, and instantly draft highly personalized cold emails that actually get replies.
          </p>

          <button 
            className="btn btn-primary" 
            style={{ fontSize: '1.2rem', padding: '1rem 2.5rem', borderRadius: '50px' }}
            onClick={() => navigate(destination)}
          >
            {user && profile ? 'Open Dashboard' : 'Start Here — It\'s Free'} <ArrowRight size={20} />
          </button>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginTop: '5rem', maxWidth: '1000px', width: '100%' }}
        >
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Zap size={24} color="var(--accent-primary)" />
            </div>
            <h3 className="mb-2">Instant Fit Scores</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>We map your exact metrics and skills to the job description to tell you if it's a High, Medium, or Stretch match.</p>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <ShieldCheck size={24} color="var(--warning)" />
            </div>
            <h3 className="mb-2">Spot Fake Jobs</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Our AI scans for vague responsibilities, unpaid "internships", and unrealistic experience requirements.</p>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Mail size={24} color="var(--success)" />
            </div>
            <h3 className="mb-2">1-Click Drafts</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Automatically generate highly personalized cold emails and DMs using your specific personality signal and metrics.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Landing;
