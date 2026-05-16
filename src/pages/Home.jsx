import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle, Search, Mail, MessageSquare, AlertTriangle, FileText, ChevronDown, ChevronUp, MapPin, DollarSign, Briefcase, Users, ThumbsUp, ThumbsDown, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import BACKEND_URL from '../lib/config';

function calcCompleteness(p) {
  if (!p) return 0;
  const pr = p.preferences || {};
  const prof = p.profile || {};
  let score = 0;
  if (p.goals?.length)             score += 10;
  if (prof.name)                   score += 15;
  if (prof.city)                   score += 5;
  if (prof.education)              score += 10;
  if (p.experiences?.[0]?.metric) score += 15;
  if (p.selectedSkills?.length)   score += 10;
  if (p.targetRoles?.length)      score += 10;
  if (pr.workTypes?.length)       score += 5;
  if (pr.locations?.length)       score += 5;
  if (pr.stipend)                  score += 5;
  if (p.personalitySignal?.length >= 20) score += 10;
  return score;
}

const MatchBadge = ({ match }) => {
  const cfg = match === 'Yes' ? { bg:'#dcfce7', color:'#166534', label:'✓ Match' }
    : match === 'No'  ? { bg:'#fee2e2', color:'#991b1b', label:'✗ Mismatch' }
    : { bg:'#fef3c7', color:'#92400e', label:'? Unclear' };
  return <span style={{ padding:'0.2rem 0.65rem', borderRadius:'9999px', fontSize:'0.75rem', fontWeight:600, background:cfg.bg, color:cfg.color }}>{cfg.label}</span>;
};

const PrefRow = ({ icon: Icon, label, jd, candidate, match, note }) => (
  <div style={{ display:'flex', gap:'1rem', padding:'1rem', background:'rgba(0,0,0,0.15)', borderRadius:'8px', marginBottom:'0.5rem' }}>
    <Icon size={18} color="var(--text-secondary)" style={{ flexShrink:0, marginTop:'2px' }} />
    <div style={{ flex:1 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.3rem' }}>
        <span style={{ fontWeight:600, fontSize:'0.88rem' }}>{label}</span>
        <MatchBadge match={match} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', fontSize:'0.82rem', marginBottom:'0.35rem' }}>
        <div><span style={{ color:'var(--text-secondary)' }}>JD: </span><span style={{ color:'var(--text-primary)' }}>{jd || '—'}</span></div>
        <div><span style={{ color:'var(--text-secondary)' }}>You: </span><span style={{ color:'var(--text-primary)' }}>{candidate || '—'}</span></div>
      </div>
      {note && <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', fontStyle:'italic' }}>{note}</div>}
    </div>
  </div>
);

const SkillTag = ({ label, type }) => {
  const colors = {
    strong:  { bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.3)', color:'#34d399' },
    partial: { bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.3)', color:'#fbbf24' },
    missing: { bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.3)',  color:'#f87171' },
    bonus:   { bg:'rgba(139,92,246,0.12)', border:'rgba(139,92,246,0.3)', color:'#a78bfa' },
  }[type] || {};
  return <span style={{ display:'inline-block', padding:'0.2rem 0.7rem', borderRadius:'9999px', fontSize:'0.78rem', fontWeight:500, margin:'0.15rem', ...colors, border:`1px solid ${colors.border}`, color:colors.color, background:colors.bg }}>{label}</span>;
};

const Home = () => {
  const [jdText, setJdText]           = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState(null);
  const [openSection, setOpenSection] = useState('fit');
  const [analysisId, setAnalysisId]   = useState(null);
  const [feedback, setFeedback]       = useState(null);   // null | 'yes' | 'no'
  const [feedbackReasons, setFeedbackReasons] = useState([]);
  const [feedbackSaved, setFeedbackSaved]     = useState(false);
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const completeness = calcCompleteness(profile);

  const YES_REASONS = ['Matches my skills', 'Dream company 🎯', 'Good salary', 'Remote/flexible', 'Strong career growth', 'Interesting domain'];
  const NO_REASONS  = ['Skills gap too big', 'Salary too low', 'Wrong location', 'Culture mismatch', 'Role not a fit', 'Too senior/junior'];

  const toggleReason = (r) => setFeedbackReasons(prev => prev.includes(r) ? prev.filter(x=>x!==r) : [...prev, r]);

  const handleAnalyze = async () => {
    if (!jdText.trim()) return;
    setIsAnalyzing(true); setResult(null); setError(null); setFeedback(null); setFeedbackReasons([]); setFeedbackSaved(false);
    try {
      const res = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jdText, userProfile: profile || {} }),
      });
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.details || e.error || 'Failed'); }
      const data = await res.json();
      setResult(data);
      if (user) {
        const { data: saved } = await supabase.from('analyses')
          .insert({ user_id: user.id, job_description: jdText, result: data })
          .select('id').single();
        if (saved?.id) setAnalysisId(saved.id);
      }
    } catch (e) {
      setError(e.message || 'Something went wrong. Is the backend running?');
    } finally { setIsAnalyzing(false); }
  };

  const saveFeedback = async () => {
    if (!analysisId || !feedback) return;
    await supabase.from('analyses').update({
      feedback_decision: feedback,
      feedback_reasons: feedbackReasons,
    }).eq('id', analysisId);
    setFeedbackSaved(true);
  };

  const toggle = (s) => setOpenSection(o => o === s ? null : s);
  const Section = ({ id, title, children }) => (
    <div style={{ borderBottom:'1px solid var(--border-color)' }}>
      <div style={{ padding:'1.25rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', userSelect:'none' }} onClick={() => toggle(id)}>
        <span style={{ fontWeight:600, fontSize:'1rem' }}>{title}</span>
        {openSection === id ? <ChevronUp size={18} color="var(--text-secondary)"/> : <ChevronDown size={18} color="var(--text-secondary)"/>}
      </div>
      {openSection === id && <div style={{ padding:'0.5rem 2rem 2rem' }}>{children}</div>}
    </div>
  );

  return (
    <div style={{ width:'100%', maxWidth:'900px', margin:'0 auto', paddingTop:'1rem' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>

        {/* Header */}
        <div className="dash-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
          <h1 style={{ fontSize:'2.2rem', marginBottom:0 }}>Dashboard</h1>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:'4px' }}>Profile Completeness</div>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <div style={{ width:'130px', height:'6px', background:'rgba(255,255,255,0.08)', borderRadius:'9999px', overflow:'hidden' }}>
                <div style={{ width:`${completeness}%`, height:'100%', background: completeness >= 80 ? 'var(--success)' : completeness >= 50 ? 'var(--warning)' : 'var(--danger)', transition:'width 1s ease' }} />
              </div>
              <span style={{ fontWeight:700, color: completeness >= 80 ? 'var(--success)' : completeness >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{completeness}%</span>
            </div>
            {completeness < 100 && (
              <button onClick={() => navigate('/profile')} style={{ background:'transparent', border:'none', color:'var(--accent-primary)', cursor:'pointer', fontSize:'0.8rem', marginTop:'4px' }}>
                View what's missing →
              </button>
            )}
          </div>
        </div>

        {/* No profile warning */}
        {!profile && (
          <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'10px', padding:'1.25rem 1.5rem', marginBottom:'1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:600, color:'var(--warning)', marginBottom:'0.2rem' }}>⚠️ Profile not set up yet</div>
              <div style={{ fontSize:'0.85rem', color:'var(--text-secondary)' }}>Analysis works best with your full profile. Set it up to get personalized results.</div>
            </div>
            <button className="btn btn-secondary" style={{ flexShrink:0 }} onClick={() => navigate('/onboarding')}>Set Up Profile</button>
          </div>
        )}

        {/* JD Input */}
        <div className="glass-panel" style={{ padding:'2rem', marginBottom:'2rem' }}>
          <h2 style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
            <Search size={22} color="var(--accent-primary)"/> Drop Job Description Here
          </h2>
          <textarea
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            placeholder="Paste the full LinkedIn / job posting text here — the more detail the better..."
            className="input-field"
            style={{ minHeight:'180px', fontSize:'0.95rem', marginBottom:'1rem' }}
          />
          {error && <div style={{ color:'var(--danger)', fontSize:'0.88rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.4rem' }}><AlertTriangle size={15}/> {error}</div>}
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <motion.button
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !jdText.trim()}
              whileHover={!isAnalyzing && jdText.trim() ? { scale:1.04 } : {}}
              whileTap={!isAnalyzing && jdText.trim() ? { scale:0.97 } : {}}
              style={{ opacity: (!jdText.trim() || isAnalyzing) ? 0.6 : 1, position:'relative', overflow:'hidden', minWidth:'150px' }}
            >
              {isAnalyzing ? (
                <span style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <motion.img
                    src="/logo-light.png"
                    alt="analyzing"
                    style={{ width:'22px', height:'22px', borderRadius:'5px' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  />
                  Analyzing…
                </span>
              ) : (
                <span style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <Search size={16}/> Analyze JD
                </span>
              )}
            </motion.button>
          </div>
        </div>

        {/* ── Full-screen analyzing overlay ── */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              key="analyzing-overlay"
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              exit={{ opacity:0 }}
              style={{ position:'fixed', inset:0, zIndex:300, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(15,23,42,0.82)', backdropFilter:'blur(8px)' }}
            >
              {/* Outer pulse rings */}
              <div style={{ position:'relative', width:'140px', height:'140px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {[0,1,2].map(i => (
                  <motion.div key={i}
                    style={{ position:'absolute', borderRadius:'50%', border:'2px solid rgba(59,130,246,0.4)' }}
                    animate={{ scale:[1, 1.8 + i*0.4], opacity:[0.6, 0] }}
                    transition={{ duration: 1.8, repeat:Infinity, delay: i * 0.5, ease:'easeOut' }}
                    initial={{ width:'80px', height:'80px' }}
                  />
                ))}
                {/* Logo in centre */}
                <motion.div
                  style={{ width:'80px', height:'80px', borderRadius:'18px', overflow:'hidden', boxShadow:'0 0 30px rgba(59,130,246,0.5)', zIndex:1 }}
                  animate={{ scale:[1, 1.06, 1] }}
                  transition={{ duration:1.4, repeat:Infinity, ease:'easeInOut' }}
                >
                  <img src="/logo.png" alt="JobLens" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                </motion.div>
              </div>

              {/* Animated status text */}
              <motion.div
                style={{ marginTop:'2rem', textAlign:'center' }}
                animate={{ opacity:[0.5,1,0.5] }}
                transition={{ duration:1.8, repeat:Infinity }}
              >
                <div style={{ fontWeight:700, fontSize:'1.1rem', color:'var(--text-primary)', marginBottom:'0.4rem' }}>Analyzing your fit…</div>
                <div style={{ color:'var(--text-secondary)', fontSize:'0.88rem' }}>Matching skills · Checking preferences · Drafting email</div>
              </motion.div>

              {/* Progress bar */}
              <motion.div
                style={{ width:'220px', height:'3px', background:'rgba(255,255,255,0.1)', borderRadius:'9999px', marginTop:'1.5rem', overflow:'hidden' }}
              >
                <motion.div
                  style={{ height:'100%', background:'linear-gradient(90deg,var(--accent-primary),var(--accent-secondary))', borderRadius:'9999px' }}
                  animate={{ x:['-100%','100%'] }}
                  transition={{ duration:1.4, repeat:Infinity, ease:'easeInOut' }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="glass-panel" style={{ overflow:'hidden' }}>

              <div className="result-header" style={{ padding:'2rem', borderBottom:'1px solid var(--border-color)', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem' }}>
                <div>
                  <h2 style={{ marginBottom:'0.5rem' }}>{result.role} <span style={{ color:'var(--text-secondary)', fontWeight:400 }}>@</span> {result.company}</h2>
                  <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
                    <span className={`badge ${result.probability==='High'?'badge-success':result.probability==='Medium'?'badge-warning':'badge-danger'}`}>
                      {result.probability} Probability
                    </span>
                    {result.isSpam && <span className="badge badge-danger"><AlertTriangle size={13}/> Spam Suspected</span>}
                  </div>
                  {result.isSpam && result.spamReason && <p style={{ fontSize:'0.82rem', color:'var(--danger)', marginTop:'0.5rem' }}>⚠️ {result.spamReason}</p>}
                </div>
                <div style={{ textAlign:'center' }}>
                  <div className={`score-circle ${result.fitScore>=7?'score-high':result.fitScore>=4?'score-medium':'score-low'}`}>{result.fitScore}</div>
                  <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginTop:'0.3rem', display:'block' }}>/ 10 Fit Score</span>
                </div>
              </div>

              {/* Fit reason */}
              <div style={{ padding:'1.5rem 2rem', borderBottom:'1px solid var(--border-color)', background:'rgba(16,185,129,0.05)' }}>
                <p style={{ lineHeight:1.7, margin:0, color:'var(--text-primary)', fontSize:'0.95rem' }}>{result.fitReason}</p>
              </div>

              {/* Dream Company Banner */}
              {result.companyMatch?.isDreamCompany && (
                <div style={{ padding:'1rem 2rem', borderBottom:'1px solid var(--border-color)', background:'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(239,68,68,0.06))', display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <Star size={20} color="#f59e0b" fill="#f59e0b"/>
                  <div>
                    <span style={{ fontWeight:700, color:'#f59e0b', fontSize:'0.9rem' }}>Dream Company Match! </span>
                    <span style={{ fontSize:'0.85rem', color:'var(--text-secondary)' }}>{result.companyMatch.note}</span>
                  </div>
                </div>
              )}
              {result.companyMatch && !result.companyMatch.isDreamCompany && result.companyMatch.note && (
                <div style={{ padding:'0.75rem 2rem', borderBottom:'1px solid var(--border-color)', fontSize:'0.82rem', color:'var(--text-secondary)' }}>
                  🏢 {result.companyMatch.note}
                </div>
              )}

              {/* Section: Pros & Flags */}
              <Section id="fit" title="✅ Strengths & ⚠️ Red Flags">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
                  <div>
                    <div style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--success)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.75rem' }}>What works in your favour</div>
                    {(result.pros||[]).map((p,i) => <div key={i} style={{ display:'flex', gap:'0.5rem', marginBottom:'0.5rem', fontSize:'0.88rem', color:'var(--text-secondary)', lineHeight:1.5 }}><span style={{ color:'var(--success)', flexShrink:0 }}>✓</span>{p}</div>)}
                  </div>
                  <div>
                    <div style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--warning)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.75rem' }}>Gaps & concerns</div>
                    {(result.flags||[]).length ? result.flags.map((f,i) => <div key={i} style={{ display:'flex', gap:'0.5rem', marginBottom:'0.5rem', fontSize:'0.88rem', color:'var(--text-secondary)', lineHeight:1.5 }}><span style={{ color:'var(--warning)', flexShrink:0 }}>⚠</span>{f}</div>)
                      : <div style={{ color:'var(--text-secondary)', fontSize:'0.88rem' }}>No major gaps detected! 🎉</div>}
                  </div>
                </div>
              </Section>

              {/* Section: Preference Check */}
              {result.preferenceCheck && (
                <Section id="prefs" title="🔍 Preference & Culture Match">
                  <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'1rem' }}>Comparing your stated preferences against what the JD actually offers:</p>
                  <PrefRow icon={DollarSign} label="Salary / Stipend" jd={result.preferenceCheck.salary?.jdOffers} candidate={result.preferenceCheck.salary?.candidateExpects} match={result.preferenceCheck.salary?.match} note={result.preferenceCheck.salary?.note} />
                  <PrefRow icon={MapPin}     label="Location"        jd={result.preferenceCheck.location?.jdLocation} candidate={result.preferenceCheck.location?.candidatePrefers} match={result.preferenceCheck.location?.match} note={result.preferenceCheck.location?.note} />
                  <PrefRow icon={Briefcase}  label="Work Type"       jd={result.preferenceCheck.workType?.jdType} candidate={result.preferenceCheck.workType?.candidatePrefers} match={result.preferenceCheck.workType?.match} note={result.preferenceCheck.workType?.note} />
                  {result.preferenceCheck.culture && (
                    <div style={{ padding:'1rem', background: result.preferenceCheck.culture.redFlag ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.06)', border:`1px solid ${result.preferenceCheck.culture.redFlag?'rgba(239,68,68,0.25)':'rgba(16,185,129,0.2)'}`, borderRadius:'8px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.4rem' }}>
                        <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}><Users size={16} color="var(--text-secondary)"/> <span style={{ fontWeight:600, fontSize:'0.88rem' }}>Culture Check</span></div>
                        {result.preferenceCheck.culture.redFlag
                          ? <span style={{ background:'rgba(239,68,68,0.15)', color:'#f87171', padding:'0.2rem 0.65rem', borderRadius:'9999px', fontSize:'0.75rem', fontWeight:600 }}>🚨 Culture Clash</span>
                          : <span style={{ background:'rgba(16,185,129,0.15)', color:'#34d399', padding:'0.2rem 0.65rem', borderRadius:'9999px', fontSize:'0.75rem', fontWeight:600 }}>✓ Aligned</span>}
                      </div>
                      <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:'0.3rem' }}>JD signals: <span style={{ color:'var(--text-primary)' }}>{result.preferenceCheck.culture.jdCultureSignals}</span></div>
                      <div style={{ fontSize:'0.82rem', color: result.preferenceCheck.culture.redFlag ? '#f87171' : 'var(--text-secondary)' }}>{result.preferenceCheck.culture.note}</div>
                    </div>
                  )}
                </Section>
              )}

              {/* Section: Skills Gap */}
              {result.skillsGapAnalysis && (
                <Section id="skills" title="🧠 Skills Gap Analysis">
                  {result.skillsGapAnalysis.strongMatches?.length > 0 && (
                    <div style={{ marginBottom:'0.75rem' }}>
                      <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#34d399', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.35rem' }}>✓ Strong Matches</div>
                      {result.skillsGapAnalysis.strongMatches.map(s => <SkillTag key={s} label={s} type="strong"/>)}
                    </div>
                  )}
                  {result.skillsGapAnalysis.partialMatches?.length > 0 && (
                    <div style={{ marginBottom:'0.75rem' }}>
                      <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#fbbf24', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.35rem' }}>~ Partial / Adjacent</div>
                      {result.skillsGapAnalysis.partialMatches.map(s => <SkillTag key={s} label={s} type="partial"/>)}
                    </div>
                  )}
                  {result.skillsGapAnalysis.missingSkills?.length > 0 && (
                    <div style={{ marginBottom:'0.75rem' }}>
                      <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#f87171', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.35rem' }}>✗ Missing / Gaps</div>
                      {result.skillsGapAnalysis.missingSkills.map(s => <SkillTag key={s} label={s} type="missing"/>)}
                    </div>
                  )}
                  {result.skillsGapAnalysis.bonusSkills?.length > 0 && (
                    <div>
                      <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#a78bfa', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.35rem' }}>🌟 Bonus Skills (not required but impressive)</div>
                      {result.skillsGapAnalysis.bonusSkills.map(s => <SkillTag key={s} label={s} type="bonus"/>)}
                    </div>
                  )}
                </Section>
              )}

              {/* Section: Drafts */}
              <Section id="drafts" title="📬 Application Drafts">
                <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                  {result.emailDraft && (
                    <div style={{ background:'rgba(0,0,0,0.2)', padding:'1.5rem', borderRadius:'8px', border:'1px solid var(--border-color)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                        <h4 style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--accent-primary)', margin:0 }}><Mail size={16}/> Cold Outreach Email</h4>
                        <button className="btn btn-secondary" style={{ padding:'0.25rem 0.75rem', fontSize:'0.8rem' }} onClick={() => navigator.clipboard.writeText(result.emailDraft)}>Copy</button>
                      </div>
                      <p style={{ whiteSpace:'pre-wrap', fontSize:'0.9rem', color:'var(--text-secondary)', lineHeight:1.65, margin:0 }}>{result.emailDraft}</p>
                    </div>
                  )}
                  {result.dmDraft && (
                    <div style={{ background:'rgba(0,0,0,0.2)', padding:'1.5rem', borderRadius:'8px', border:'1px solid var(--border-color)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                        <h4 style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--accent-secondary)', margin:0 }}><MessageSquare size={16}/> LinkedIn DM</h4>
                        <button className="btn btn-secondary" style={{ padding:'0.25rem 0.75rem', fontSize:'0.8rem' }} onClick={() => navigator.clipboard.writeText(result.dmDraft)}>Copy</button>
                      </div>
                      <p style={{ whiteSpace:'pre-wrap', fontSize:'0.9rem', color:'var(--text-secondary)', lineHeight:1.65, margin:0 }}>{result.dmDraft}</p>
                    </div>
                  )}
                  {result.applicationQA?.length > 0 && (
                    <div style={{ background:'rgba(0,0,0,0.2)', padding:'1.5rem', borderRadius:'8px', border:'1px solid var(--border-color)' }}>
                      <h4 style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--success)', margin:'0 0 1rem' }}><FileText size={16}/> Application Q&A</h4>
                      {result.applicationQA.map((qa,i) => (
                        <div key={i} style={{ marginBottom:'1.25rem' }}>
                          <p style={{ fontWeight:600, color:'var(--text-primary)', marginBottom:'0.4rem', fontSize:'0.9rem' }}>Q: {qa.question}</p>
                          <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start' }}>
                            <p style={{ whiteSpace:'pre-wrap', fontSize:'0.88rem', color:'var(--text-secondary)', lineHeight:1.6, flex:1, margin:0 }}>{qa.answer}</p>
                            <button className="btn btn-secondary" style={{ padding:'0.25rem 0.5rem', fontSize:'0.75rem', flexShrink:0 }} onClick={() => navigator.clipboard.writeText(qa.answer)}>Copy</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Section>

              {/* ── Feedback Widget ── */}
              <div style={{ padding:'1.75rem 2rem', borderTop:'1px solid var(--border-color)', background:'rgba(255,255,255,0.02)' }}>
                {!feedbackSaved ? (
                  <>
                    <div style={{ fontWeight:600, fontSize:'0.95rem', marginBottom:'1rem' }}>
                      Would you apply for this job?
                    </div>
                    <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1rem' }}>
                      <button onClick={() => { setFeedback('yes'); setFeedbackReasons([]); }}
                        style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.6rem 1.25rem', borderRadius:'8px', border:`2px solid ${feedback==='yes'?'var(--success)':'var(--border-color)'}`, background: feedback==='yes'?'rgba(16,185,129,0.1)':'transparent', color: feedback==='yes'?'var(--success)':'var(--text-secondary)', cursor:'pointer', fontWeight:600, fontSize:'0.9rem', transition:'all 0.15s' }}>
                        <ThumbsUp size={16}/> Yes, I'd apply
                      </button>
                      <button onClick={() => { setFeedback('no'); setFeedbackReasons([]); }}
                        style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.6rem 1.25rem', borderRadius:'8px', border:`2px solid ${feedback==='no'?'var(--danger)':'var(--border-color)'}`, background: feedback==='no'?'rgba(239,68,68,0.1)':'transparent', color: feedback==='no'?'var(--danger)':'var(--text-secondary)', cursor:'pointer', fontWeight:600, fontSize:'0.9rem', transition:'all 0.15s' }}>
                        <ThumbsDown size={16}/> Not this one
                      </button>
                    </div>

                    {feedback && (
                      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
                        <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:'0.5rem' }}>
                          {feedback==='yes' ? 'What made you say yes? (pick any)' : 'What held you back? (pick any)'}
                        </div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem', marginBottom:'1rem' }}>
                          {(feedback==='yes' ? YES_REASONS : NO_REASONS).map(r => (
                            <button key={r} onClick={() => toggleReason(r)}
                              style={{ padding:'0.3rem 0.85rem', borderRadius:'9999px', fontSize:'0.8rem', fontWeight:500, cursor:'pointer', transition:'all 0.12s',
                                border: feedbackReasons.includes(r) ? `1.5px solid ${feedback==='yes'?'var(--success)':'var(--danger)'}` : '1.5px solid var(--border-color)',
                                background: feedbackReasons.includes(r) ? (feedback==='yes'?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.1)') : 'transparent',
                                color: feedbackReasons.includes(r) ? (feedback==='yes'?'var(--success)':'var(--danger)') : 'var(--text-secondary)',
                              }}>
                              {feedbackReasons.includes(r) ? '✓ ' : ''}{r}
                            </button>
                          ))}
                        </div>
                        <button onClick={saveFeedback} className="btn btn-primary" style={{ padding:'0.5rem 1.5rem', fontSize:'0.88rem' }}>
                          Save Feedback
                        </button>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--success)', fontSize:'0.9rem', fontWeight:600 }}>
                    <CheckCircle size={18}/> Feedback saved! We'll use this to improve your future results.
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }

        /* Dashboard mobile fixes */
        @media (max-width: 640px) {
          /* Score header stacks */
          .result-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          /* Pros & flags grid collapses */
          .pros-flags-grid {
            grid-template-columns: 1fr !important;
          }
          /* Pref row grid collapses */
          .pref-row-grid {
            grid-template-columns: 1fr !important;
          }
          /* Section padding shrinks */
          .result-section-body {
            padding: 0.75rem 1rem 1.5rem !important;
          }
          .result-section-header {
            padding: 1rem !important;
          }
          /* Feedback buttons stack */
          .feedback-btns {
            flex-direction: column !important;
          }
          /* Skill tags smaller */
          .skill-tag { font-size: 0.72rem !important; }

          /* Dashboard header stacks */
          .dash-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .dash-header > div:last-child {
            text-align: left !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
