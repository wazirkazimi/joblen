import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, User, KeyRound, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

// mode: 'login' | 'signup' | 'forgot' | 'forgot-sent'
const AuthPage = () => {
  const [mode, setMode]         = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const reset = (m) => { setMode(m); setError(''); setSuccess(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } }
      });
      if (error) setError(error.message);
      else setSuccess('Account created! 🎉 Check your email to confirm, then log in.');

    } else if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);

    } else if (mode === 'forgot') {
      const redirectTo = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) setError(error.message);
      else setMode('forgot-sent');
    }

    setLoading(false);
  };

  // ─── Forgot-sent confirmation screen ───────────────────────────────────────
  if (mode === 'forgot-sent') {
    return (
      <div style={{ width:'100%', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
          className="glass-panel" style={{ width:'100%', maxWidth:'440px', padding:'2.5rem', textAlign:'center' }}>
          <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'rgba(16,185,129,0.15)', border:'2px solid var(--success)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem' }}>
            <CheckCircle2 size={32} color="var(--success)" />
          </div>
          <h2 style={{ marginBottom:'0.75rem' }}>Check your inbox 📬</h2>
          <p style={{ color:'var(--text-secondary)', lineHeight:1.65, marginBottom:'2rem', fontSize:'0.95rem' }}>
            We sent a password reset link to <strong style={{ color:'var(--text-primary)' }}>{email}</strong>.
            <br/><br/>
            Click the link in the email — it'll bring you back here to set a new password.
          </p>
          <button className="btn btn-secondary" style={{ width:'100%', justifyContent:'center' }} onClick={() => reset('login')}>
            Back to Login
          </button>
          <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:'1rem' }}>
            Didn't receive it?{' '}
            <span style={{ color:'var(--accent-primary)', cursor:'pointer' }} onClick={() => reset('forgot')}>
              Try again
            </span>
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── Forgot password form ───────────────────────────────────────────────────
  if (mode === 'forgot') {
    return (
      <div style={{ width:'100%', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <Logo size={56} textSize="2rem" />
        </div>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          className="glass-panel" style={{ width:'100%', maxWidth:'440px', padding:'2.5rem' }}>

          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.5rem' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(139,92,246,0.15)', border:'1px solid rgba(139,92,246,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <KeyRound size={20} color="var(--accent-secondary)"/>
            </div>
            <div>
              <h2 style={{ marginBottom:0, fontSize:'1.3rem' }}>Forgot Password?</h2>
              <p style={{ color:'var(--text-secondary)', fontSize:'0.82rem', margin:0 }}>No worries, we'll send you a reset link</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem', marginTop:'1.75rem' }}>
            <div style={{ position:'relative' }}>
              <Mail size={18} style={{ position:'absolute', left:'1rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-secondary)' }}/>
              <input
                className="input-field"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft:'3rem' }}
                required
              />
            </div>

            {error && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px', padding:'0.75rem 1rem', color:'var(--danger)', fontSize:'0.9rem' }}>
                ⚠️ {error}
              </motion.div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:'100%', justifyContent:'center', opacity:loading?0.7:1 }}>
              {loading ? 'Sending…' : <><Mail size={16}/> Send Reset Link</>}
            </button>

            <button type="button" className="btn btn-secondary" style={{ width:'100%', justifyContent:'center' }} onClick={() => reset('login')}>
              ← Back to Login
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ─── Login / Signup form ────────────────────────────────────────────────────
  return (
    <div style={{ width:'100%', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <Logo size={56} textSize="2rem" />
          <p style={{ color:'var(--text-secondary)', fontSize:'0.95rem', marginTop:'0.5rem' }}>Your AI-powered career advisor for freshers</p>
        </div>

      {/* Card */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="glass-panel" style={{ width:'100%', maxWidth:'440px', padding:'2.5rem' }}>

        {/* Tab Toggle */}
        <div style={{ display:'flex', background:'rgba(0,0,0,0.3)', borderRadius:'10px', padding:'4px', marginBottom:'2rem' }}>
          {['login','signup'].map(m => (
            <button key={m} onClick={() => reset(m)}
              style={{ flex:1, padding:'0.6rem', borderRadius:'7px', border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.95rem', transition:'all 0.2s',
                background: mode===m ? 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))' : 'transparent',
                color: mode===m ? 'white' : 'var(--text-secondary)',
              }}>
              {m === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <AnimatePresence mode="wait">
            {mode === 'signup' && (
              <motion.div key="name" initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} style={{ overflow:'hidden' }}>
                <div style={{ position:'relative' }}>
                  <User size={18} style={{ position:'absolute', left:'1rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-secondary)' }}/>
                  <input className="input-field" type="text" placeholder="Your full name" value={fullName}
                    onChange={e => setFullName(e.target.value)} style={{ paddingLeft:'3rem' }} required={mode==='signup'}/>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ position:'relative' }}>
            <Mail size={18} style={{ position:'absolute', left:'1rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-secondary)' }}/>
            <input className="input-field" type="email" placeholder="your@email.com" value={email}
              onChange={e => setEmail(e.target.value)} style={{ paddingLeft:'3rem' }} required/>
          </div>

          <div style={{ position:'relative' }}>
            <Lock size={18} style={{ position:'absolute', left:'1rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-secondary)' }}/>
            <input className="input-field" type={showPass?'text':'password'} placeholder="Password (min 6 characters)"
              value={password} onChange={e => setPassword(e.target.value)}
              style={{ paddingLeft:'3rem', paddingRight:'3rem' }} required minLength={6}/>
            <button type="button" onClick={() => setShowPass(!showPass)}
              style={{ position:'absolute', right:'1rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer' }}>
              {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>

          {/* Forgot password link — only on login */}
          {mode === 'login' && (
            <div style={{ textAlign:'right', marginTop:'-0.5rem' }}>
              <span onClick={() => reset('forgot')}
                style={{ fontSize:'0.82rem', color:'var(--accent-primary)', cursor:'pointer', fontWeight:500 }}>
                Forgot password?
              </span>
            </div>
          )}

          {error && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px', padding:'0.75rem 1rem', color:'var(--danger)', fontSize:'0.9rem' }}>
              ⚠️ {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'8px', padding:'0.75rem 1rem', color:'var(--success)', fontSize:'0.9rem' }}>
              {success}
            </motion.div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:'100%', justifyContent:'center', opacity:loading?0.7:1 }}>
            {loading ? 'Please wait…' : mode==='login' ? <><ArrowRight size={18}/> Log In</> : <><ShieldCheck size={18}/> Create Account</>}
          </button>
        </form>

        <p style={{ textAlign:'center', fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:'1.5rem' }}>
          By signing up you agree to our{' '}
          <span style={{ color:'var(--accent-primary)', cursor:'pointer' }}>Terms of Service</span>
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
