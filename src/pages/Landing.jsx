import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, BarChart3, Mail, Search, User, MessageSquare, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const STEPS = [
  { num:'01', icon:User,       color:'#3b82f6', title:'Build your profile',       desc:'Upload your resume — our AI auto-fills your skills, experience, and education in seconds. Add your target roles, salary expectations, and deal-breakers.' },
  { num:'02', icon:Search,     color:'#8b5cf6', title:'Paste any job description', desc:'Copy the full text of any LinkedIn, Naukri, Internshala, or company careers post and drop it in. No links needed — just the raw text.' },
  { num:'03', icon:BarChart3,  color:'#10b981', title:'Get your instant analysis',  desc:'See your Fit Score (1–10), skills gap breakdown, salary comparison, culture check against your hard no\'s, and whether it\'s a dream company match.' },
  { num:'04', icon:Mail,       color:'#f59e0b', title:'Apply with 1-click drafts',  desc:'Get a personalized cold email, LinkedIn DM, and Q&A answers — all written using YOUR specific metrics, projects, and personality. Not templates.' },
];

const FEATURES = [
  { icon:BarChart3,  color:'rgba(59,130,246,0.1)',   iconColor:'#3b82f6', title:'Fit Score',           desc:'Honest 1–10 score based on real skill and preference overlap — not inflated to make you feel good.' },
  { icon:ShieldCheck,color:'rgba(245,158,11,0.1)',   iconColor:'#f59e0b', title:'Spam Detector',       desc:'AI scans for vague JDs, fake internships, unpaid roles, and unrealistic requirements before you waste time.' },
  { icon:Search,     color:'rgba(139,92,246,0.1)',   iconColor:'#8b5cf6', title:'Skills Gap Analysis', desc:'Colour-coded: Strong Match, Partial, Missing, and Bonus skills — so you know exactly what to highlight or learn.' },
  { icon:Star,       color:'rgba(239,68,68,0.1)',    iconColor:'#ef4444', title:'Dream Company Match', desc:'Set your target companies in profile. We flag when a JD is from your wishlist — so you never miss your shot.' },
  { icon:Mail,       color:'rgba(16,185,129,0.1)',   iconColor:'#10b981', title:'1-Click Drafts',      desc:'Cold email, LinkedIn DM, and application Q&A — all personalized using your actual achievements, not placeholders.' },
  { icon:MessageSquare,color:'rgba(99,102,241,0.1)',iconColor:'#6366f1', title:'Feedback Loop',       desc:'Tell us if you\'d apply and why. JobLens learns your preferences over time to give sharper results with every analysis.' },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const destination = user ? (profile ? '/dashboard' : '/onboarding') : '/auth';

  return (
    <div style={{ width:'100%', minHeight:'100vh', display:'flex', flexDirection:'column', fontFamily:'Inter,system-ui,sans-serif' }}>

      {/* Navbar */}
      <nav style={{ padding:'1.25rem 3rem', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--border-color)', position:'sticky', top:0, backdropFilter:'blur(12px)', zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
        <Logo size={32} textSize="1.3rem" />
        </div>
        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
          {!user ? (
            <>
              <button className="btn btn-secondary" style={{ padding:'0.55rem 1.25rem', fontSize:'0.9rem' }} onClick={() => navigate('/auth')}>Log In</button>
              <button className="btn btn-primary"   style={{ padding:'0.55rem 1.25rem', fontSize:'0.9rem' }} onClick={() => navigate('/auth')}>Sign Up Free <ArrowRight size={15}/></button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate(destination)}>
              {profile ? 'Dashboard' : 'Complete Profile'} <ArrowRight size={16}/>
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'5rem 2rem 3rem' }}>
        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }} style={{ maxWidth:'820px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'0.4rem 1rem', borderRadius:'9999px', background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)', color:'var(--accent-primary)', fontSize:'0.85rem', fontWeight:600, marginBottom:'1.75rem' }}>
            🚀 AI Career Advisor for Freshers & Early-Career Professionals
          </div>
          <h1 style={{ fontSize:'clamp(2.5rem,6vw,4.5rem)', lineHeight:1.1, fontWeight:800, marginBottom:'1.5rem', color:'var(--text-primary)' }}>
            Stop guessing.<br/>Start <span style={{ color:'var(--accent-primary)' }}>landing interviews.</span>
          </h1>
          <p style={{ fontSize:'1.15rem', color:'var(--text-secondary)', maxWidth:'600px', margin:'0 auto 2.5rem', lineHeight:1.7 }}>
            Paste any job description → get a personalized fit score, skills gap breakdown, salary check, and a cold email that actually sounds like you — in under 10 seconds.
          </p>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
            <button className="btn btn-primary" style={{ fontSize:'1.05rem', padding:'0.9rem 2.25rem', borderRadius:'50px' }} onClick={() => navigate(destination)}>
              {user && profile ? 'Open Dashboard' : 'Start Free — No Credit Card'} <ArrowRight size={18}/>
            </button>
            {!user && (
              <button className="btn btn-secondary" style={{ fontSize:'1.05rem', padding:'0.9rem 2.25rem', borderRadius:'50px' }} onClick={() => navigate('/auth')}>
                Log In
              </button>
            )}
          </div>
          <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:'1rem', opacity:0.7 }}>
            ✓ Free forever &nbsp;·&nbsp; ✓ No email needed to try &nbsp;·&nbsp; ✓ Works on any job post
          </p>
        </motion.div>
      </section>

      {/* How it works */}
      <section style={{ padding:'5rem 2rem', maxWidth:'1100px', margin:'0 auto', width:'100%' }}>
        <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }}>
          <div style={{ textAlign:'center', marginBottom:'3.5rem' }}>
            <h2 style={{ fontSize:'2rem', fontWeight:800, marginBottom:'0.75rem' }}>How it works</h2>
            <p style={{ color:'var(--text-secondary)', fontSize:'1rem' }}>From zero to a personalized cold email in 4 steps</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'1.5rem' }}>
            {STEPS.map((s, i) => (
              <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}
                className="glass-panel" style={{ padding:'2rem', position:'relative', overflow:'hidden' }}>
                <div style={{ fontSize:'3rem', fontWeight:900, color:'rgba(255,255,255,0.04)', position:'absolute', top:'-0.5rem', right:'1rem', lineHeight:1 }}>{s.num}</div>
                <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:`${s.color}22`, border:`1px solid ${s.color}44`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.25rem' }}>
                  <s.icon size={22} color={s.color}/>
                </div>
                <h3 style={{ fontSize:'1rem', fontWeight:700, marginBottom:'0.6rem' }}>{s.title}</h3>
                <p style={{ color:'var(--text-secondary)', fontSize:'0.88rem', lineHeight:1.65, margin:0 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section style={{ padding:'3rem 2rem 5rem', maxWidth:'1100px', margin:'0 auto', width:'100%' }}>
        <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }}>
          <div style={{ textAlign:'center', marginBottom:'3rem' }}>
            <h2 style={{ fontSize:'2rem', fontWeight:800, marginBottom:'0.75rem' }}>Everything you need to apply smarter</h2>
            <p style={{ color:'var(--text-secondary)', fontSize:'1rem' }}>Not just a score — a full decision-making toolkit</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'1.25rem' }}>
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.08 }}
                className="glass-panel" style={{ padding:'1.75rem', display:'flex', gap:'1rem', alignItems:'flex-start' }}>
                <div style={{ width:'42px', height:'42px', borderRadius:'10px', background:f.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <f.icon size={20} color={f.iconColor}/>
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:'0.35rem' }}>{f.title}</div>
                  <div style={{ color:'var(--text-secondary)', fontSize:'0.85rem', lineHeight:1.6 }}>{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Bottom */}
      <section style={{ padding:'4rem 2rem', textAlign:'center', borderTop:'1px solid var(--border-color)' }}>
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
          <h2 style={{ fontSize:'2rem', fontWeight:800, marginBottom:'1rem' }}>Ready to stop guessing?</h2>
          <p style={{ color:'var(--text-secondary)', marginBottom:'2rem', fontSize:'1rem' }}>Build your profile once. Analyze any job in seconds.</p>
          <button className="btn btn-primary" style={{ fontSize:'1.1rem', padding:'0.95rem 2.5rem', borderRadius:'50px' }} onClick={() => navigate(destination)}>
            Get Started Free <ArrowRight size={18}/>
          </button>
          <div style={{ display:'flex', justifyContent:'center', gap:'2rem', marginTop:'1.5rem', flexWrap:'wrap' }}>
            {['✓ Free forever','✓ No credit card','✓ Works on any job post','✓ Resume auto-fill'].map(t => (
              <span key={t} style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>{t}</span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ padding:'1.5rem 1.5rem', borderTop:'1px solid var(--border-color)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.85rem', color:'var(--text-secondary)' }}>
        <Logo size={18} showText={false} />  JobLens — Built for freshers
        </div>
        <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', opacity:0.6 }}>
          © {new Date().getFullYear()} JobLens. All rights reserved.
        </div>
      </footer>

      {/* ── Responsive overrides ── */}
      <style>{`
        @media (max-width: 768px) {
          .landing-nav    { padding: 1rem 1.25rem !important; }
          .landing-hero   { padding: 3rem 1.25rem 2rem !important; }
          .landing-section{ padding: 3rem 1.25rem !important; }
          .landing-grid-4 { grid-template-columns: 1fr 1fr !important; }
          .landing-grid-6 { grid-template-columns: 1fr !important; }
          .landing-footer { padding: 1.25rem !important; flex-direction: column !important; text-align: center !important; }
          .landing-cta    { padding: 3rem 1.25rem !important; }
          .landing-trust  { gap: 0.75rem !important; }
        }
        @media (max-width: 480px) {
          .landing-nav-btns .btn-secondary-nav { display: none; }
          .landing-grid-4 { grid-template-columns: 1fr !important; }
          .landing-hero   { padding: 2.5rem 1rem 1.5rem !important; }
        }
      `}</style>
    </div>
  );
};

export default Landing;
