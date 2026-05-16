import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function History() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setAnalyses(data || []);
      setLoading(false);
    })();
  }, [user]);

  const deleteItem = async (id) => {
    await supabase.from('analyses').delete().eq('id', id);
    setAnalyses(prev => prev.filter(a => a.id !== id));
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'50vh' }}>
      <div style={{ width:'36px', height:'36px', borderRadius:'50%', border:'3px solid rgba(59,130,246,0.2)', borderTopColor:'var(--accent-primary)', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth:'860px', margin:'0 auto', paddingTop:'1rem' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }

        /* ── History mobile fixes ── */
        @media (max-width: 640px) {
          .history-header   { flex-direction: column !important; align-items: flex-start !important; gap: 0.25rem !important; margin-bottom: 1.25rem !important; }
          .history-row      { padding: 0.75rem 0.85rem !important; gap: 0.6rem !important; }
          .history-score    { width: 36px !important; height: 36px !important; font-size: 0.82rem !important; border-width: 2px !important; flex-shrink: 0; }
          .history-role     { font-size: 0.85rem !important; }
          .history-meta     { flex-wrap: wrap !important; gap: 0.3rem 0.5rem !important; font-size: 0.72rem !important; }
          .history-actions  { gap: 0.3rem !important; }
          .history-detail   { padding: 1rem 0.85rem !important; }
          .history-detail-grid { grid-template-columns: 1fr !important; gap: 0.75rem !important; }
          .history-email    { font-size: 0.8rem !important; padding: 0.75rem !important; }
          .history-h1       { font-size: 1.5rem !important; }
        }
      `}</style>

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
        {/* Header */}
        <div className="history-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem', flexWrap:'wrap', gap:'0.5rem' }}>
          <h1 className="history-h1" style={{ fontSize:'2.2rem', marginBottom:0 }}>Analysis History</h1>
          <span style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>{analyses.length} saved</span>
        </div>

        {analyses.length === 0 ? (
          <div className="glass-panel" style={{ padding:'4rem 2rem', textAlign:'center' }}>
            <Clock size={52} color="var(--text-secondary)" style={{ opacity:0.3, marginBottom:'1rem' }} />
            <h3 className="mb-2" style={{ color:'var(--text-secondary)' }}>No analyses yet</h3>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>Go to the Dashboard, drop a job description, and your analysis will be saved here automatically.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem' }}>
            <AnimatePresence>
              {analyses.map((item, idx) => {
                const r = item.result || {};
                const isOpen = expanded === item.id;
                const probColor = r.probability === 'High' ? 'var(--success)' : r.probability === 'Medium' ? 'var(--warning)' : 'var(--danger)';

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity:0, y:10 }}
                    animate={{ opacity:1, y:0 }}
                    exit={{ opacity:0, scale:0.97 }}
                    transition={{ delay: idx * 0.04 }}
                    className="glass-panel"
                    style={{ overflow:'hidden' }}
                  >
                    {/* ── Row header ── */}
                    <div
                      className="history-row"
                      style={{ padding:'1rem 1.25rem', display:'flex', alignItems:'center', gap:'0.85rem', cursor:'pointer' }}
                      onClick={() => setExpanded(isOpen ? null : item.id)}
                    >
                      {/* Score circle */}
                      <div
                        className="history-score"
                        style={{ width:'44px', height:'44px', borderRadius:'50%', border:`3px solid ${probColor}`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1rem', color:probColor, flexShrink:0 }}
                      >
                        {r.fitScore ?? '?'}
                      </div>

                      {/* Info block — grows, clips overflow */}
                      <div style={{ flex:1, minWidth:0, overflow:'hidden' }}>
                        <div
                          className="history-role"
                          style={{ fontWeight:600, fontSize:'0.93rem', marginBottom:'0.2rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                        >
                          {r.role || 'Unknown Role'}
                          <span style={{ color:'var(--text-secondary)', fontWeight:400 }}> @ </span>
                          {r.company || 'Unknown Company'}
                        </div>

                        {/* Meta row — wraps gracefully on mobile */}
                        <div className="history-meta" style={{ fontSize:'0.76rem', color:'var(--text-secondary)', display:'flex', flexWrap:'wrap', gap:'0.25rem 0.6rem', alignItems:'center' }}>
                          <span style={{ color:probColor, fontWeight:600 }}>{r.probability}</span>
                          <span style={{ opacity:0.4 }}>·</span>
                          <span>{formatDate(item.created_at)}</span>
                          <span style={{ opacity:0.4 }}>·</span>
                          <span>{formatTime(item.created_at)}</span>
                          {r.isSpam && (
                            <span style={{ color:'var(--danger)', display:'flex', alignItems:'center', gap:'0.2rem' }}>
                              <AlertCircle size={11}/> Spam
                            </span>
                          )}
                          {item.feedback_decision && (
                            <span style={{ background: item.feedback_decision === 'yes' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: item.feedback_decision === 'yes' ? 'var(--success)' : 'var(--danger)', padding:'0.1rem 0.45rem', borderRadius:'9999px', fontSize:'0.7rem', fontWeight:600 }}>
                              {item.feedback_decision === 'yes' ? '👍 Applied' : '👎 Skipped'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="history-actions" style={{ display:'flex', gap:'0.4rem', alignItems:'center', flexShrink:0 }}>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); deleteItem(item.id); }}
                          style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'6px', padding:'0.35rem 0.5rem', cursor:'pointer', color:'var(--danger)', display:'flex' }}
                        >
                          <Trash2 size={14}/>
                        </button>
                        {isOpen
                          ? <ChevronUp   size={17} color="var(--text-secondary)"/>
                          : <ChevronDown size={17} color="var(--text-secondary)"/>
                        }
                      </div>
                    </div>

                    {/* ── Expanded detail ── */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height:0, opacity:0 }}
                          animate={{ height:'auto', opacity:1 }}
                          exit={{ height:0, opacity:0 }}
                          transition={{ duration:0.22 }}
                          style={{ borderTop:'1px solid var(--border-color)', overflow:'hidden' }}
                        >
                          <div className="history-detail" style={{ padding:'1.25rem 1.25rem' }}>
                            {r.fitReason && (
                              <p style={{ marginBottom:'1rem', lineHeight:1.65, padding:'0.85rem 1rem', background:'rgba(16,185,129,0.07)', borderRadius:'8px', fontSize:'0.88rem', color:'var(--text-primary)' }}>
                                {r.fitReason}
                              </p>
                            )}

                            <div className="history-detail-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
                              <div>
                                <div style={{ fontSize:'0.74rem', fontWeight:700, color:'var(--success)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.4rem' }}>✓ Strengths</div>
                                {(r.pros || []).slice(0,3).map((p,i) => (
                                  <div key={i} style={{ fontSize:'0.83rem', color:'var(--text-secondary)', marginBottom:'0.3rem', lineHeight:1.4 }}>• {p}</div>
                                ))}
                              </div>
                              <div>
                                <div style={{ fontSize:'0.74rem', fontWeight:700, color:'var(--warning)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.4rem' }}>⚠ Red Flags</div>
                                {(r.flags || []).slice(0,3).map((f,i) => (
                                  <div key={i} style={{ fontSize:'0.83rem', color:'var(--text-secondary)', marginBottom:'0.3rem', lineHeight:1.4 }}>• {f}</div>
                                ))}
                              </div>
                            </div>

                            {r.emailDraft && (
                              <div className="history-email" style={{ background:'rgba(0,0,0,0.2)', borderRadius:'8px', padding:'1rem', fontSize:'0.83rem', color:'var(--text-secondary)', lineHeight:1.65, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                                <div style={{ fontWeight:600, color:'var(--text-primary)', marginBottom:'0.5rem' }}>📧 Email Draft</div>
                                {r.emailDraft}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
