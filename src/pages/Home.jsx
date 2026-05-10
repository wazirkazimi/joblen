import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle, Search, Mail, MessageSquare, AlertTriangle, FileText, ChevronDown, ChevronUp, MapPin, DollarSign, Briefcase, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

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
  const [jdText, setJdText]       = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);
  const [openSection, setOpenSection] = useState('fit');
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const completeness = calcCompleteness(profile);

  const handleAnalyze = async () => {
    if (!jdText.trim()) return;
    setIsAnalyzing(true); setResult(null); setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jdText, userProfile: profile || {} }),
      });
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.details || e.error || 'Failed'); }
      const data = await res.json();
      setResult(data);
      if (user) await supabase.from('analyses').insert({ user_id: user.id, job_description: jdText, result: data });
    } catch (e) {
      setError(e.message || 'Something went wrong. Is the backend running?');
    } finally { setIsAnalyzing(false); }
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
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
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
            <button className="btn btn-primary" onClick={handleAnalyze} disabled={isAnalyzing || !jdText.trim()} style={{ opacity: (!jdText.trim() || isAnalyzing) ? 0.5 : 1 }}>
              {isAnalyzing
                ? <><div style={{ width:'16px', height:'16px', border:'2px solid white', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/> Analyzing…</>
                : <><Search size={16}/> Analyze JD</>}
            </button>
          </div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="glass-panel" style={{ overflow:'hidden' }}>

              {/* Score header */}
              <div style={{ padding:'2rem', borderBottom:'1px solid var(--border-color)', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem' }}>
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default Home;
