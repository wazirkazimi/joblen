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
      const { data, error } = await supabase
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
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'50vh' }}>
      <div style={{ width:'36px', height:'36px', borderRadius:'50%', border:'3px solid rgba(59,130,246,0.2)', borderTopColor:'var(--accent-primary)', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth:'860px', margin:'0 auto', paddingTop:'1rem' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
        <div className="history-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem', flexWrap:'wrap', gap:'0.5rem' }}>
          <h1 style={{ fontSize:'2.2rem', marginBottom:0 }}>Analysis History</h1>
          <span style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>{analyses.length} saved</span>
        </div>

        {analyses.length === 0 ? (
          <div className="glass-panel" style={{ padding:'4rem 2rem', textAlign:'center' }}>
            <Clock size={52} color="var(--text-secondary)" style={{ opacity:0.3, marginBottom:'1rem' }} />
            <h3 className="mb-2" style={{ color:'var(--text-secondary)' }}>No analyses yet</h3>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>Go to the Dashboard, drop a job description, and your analysis will be saved here automatically.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            <AnimatePresence>
              {analyses.map((item, idx) => {
                const r = item.result || {};
                const isOpen = expanded === item.id;
                const probColor = r.probability === 'High' ? 'var(--success)' : r.probability === 'Medium' ? 'var(--warning)' : 'var(--danger)';
                return (
                  <motion.div key={item.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, height:0 }} transition={{ delay: idx * 0.04 }}
                    className="glass-panel" style={{ overflow:'hidden' }}>
                    {/* Row header */}
                    <div style={{ padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:'1rem', cursor:'pointer' }}
                      onClick={() => setExpanded(isOpen ? null : item.id)}>
                      {/* Score */}
                      <div style={{ width:'44px', height:'44px', borderRadius:'50%', border:`3px solid ${probColor}`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1rem', color:probColor, flexShrink:0 }}>
                        {r.fitScore ?? '?'}
                      </div>
                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:'0.95rem', marginBottom:'0.15rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {r.role || 'Unknown Role'} @ {r.company || 'Unknown Company'}
                        </div>
                        <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', display:'flex', gap:'0.75rem', alignItems:'center' }}>
                          <span style={{ color: probColor, fontWeight:500 }}>{r.probability}</span>
                          <span>·</span>
                          <span>{formatDate(item.created_at)}</span>
                          {r.isSpam && <span style={{ color:'var(--danger)', display:'flex', alignItems:'center', gap:'0.2rem' }}><AlertCircle size={12}/> Spam suspected</span>}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                        <button type="button" onClick={e=>{e.stopPropagation();deleteItem(item.id);}}
                          style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'6px', padding:'0.35rem 0.6rem', cursor:'pointer', color:'var(--danger)', display:'flex' }}>
                          <Trash2 size={14}/>
                        </button>
                        {isOpen ? <ChevronUp size={18} color="var(--text-secondary)"/> : <ChevronDown size={18} color="var(--text-secondary)"/>}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
                          style={{ borderTop:'1px solid var(--border-color)', padding:'1.5rem', overflow:'hidden' }}>
                          {r.fitReason && <p style={{ marginBottom:'1rem', lineHeight:1.6, padding:'1rem', background:'rgba(16,185,129,0.07)', borderRadius:'8px', fontSize:'0.9rem' }}>{r.fitReason}</p>}
                          <div className="history-detail-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
                            <div>
                              <div style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--success)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.5rem' }}>✓ Pros</div>
                              {(r.pros||[]).map((p,i) => <div key={i} style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'0.3rem' }}>• {p}</div>)}
                            </div>
                            <div>
                              <div style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--warning)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.5rem' }}>⚠ Red Flags</div>
                              {(r.flags||[]).map((f,i) => <div key={i} style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'0.3rem' }}>• {f}</div>)}
                            </div>
                          </div>
                          {r.emailDraft && (
                            <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:'8px', padding:'1rem', fontSize:'0.85rem', color:'var(--text-secondary)', lineHeight:1.6, whiteSpace:'pre-wrap' }}>
                              <div style={{ fontWeight:600, color:'var(--text-primary)', marginBottom:'0.5rem' }}>📧 Email Draft</div>
                              {r.emailDraft}
                            </div>
                          )}
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
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 640px) {
          .history-header { flex-direction: column; align-items: flex-start !important; }
          .history-detail-grid { grid-template-columns: 1fr !important; }
          .history-row-header { padding: 0.85rem 1rem !important; gap: 0.65rem !important; }
          .history-score-circle { width: 36px !important; height: 36px !important; font-size: 0.85rem !important; }
        }
      `}</style>
    </div>
  );
}
