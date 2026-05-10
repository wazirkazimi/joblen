import React, { useState, useRef, useEffect } from 'react';
import { X, Search, ChevronDown, Plus } from 'lucide-react';

export default function SearchableDropdown({ options = [], selected = [], onChange, placeholder = 'Search...', label, required }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  const trimmed = q.trim();
  const filtered = trimmed
    ? options.filter(o => o.toLowerCase().includes(trimmed.toLowerCase()))
    : options;

  // custom value exists if typed text doesn't exactly match any option
  const canAddCustom = trimmed.length > 0 && !options.some(o => o.toLowerCase() === trimmed.toLowerCase()) && !selected.includes(trimmed);

  const toggle = (val) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };
  const addCustom = () => {
    if (!trimmed) return;
    if (!selected.includes(trimmed)) onChange([...selected, trimmed]);
    setQ('');
  };

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position:'relative', width:'100%' }}>
      {label && (
        <label className="input-label" style={{ display:'block', marginBottom:'0.4rem' }}>
          {label}{required && ' *'}
        </label>
      )}

      {/* Selected chips */}
      {selected.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:'0.35rem', marginBottom:'0.5rem' }}>
          {selected.map(s => (
            <span key={s} style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', padding:'0.25rem 0.65rem', borderRadius:'9999px', fontSize:'0.82rem', fontWeight:500, background:'rgba(59,130,246,0.18)', border:'1px solid #3b82f6', color:'#93c5fd' }}>
              {s}
              <X size={11} style={{ cursor:'pointer', opacity:0.8 }} onClick={() => toggle(s)} />
            </span>
          ))}
        </div>
      )}

      {/* Trigger / search box */}
      <div
        className="input-field"
        style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'text', padding:'0.6rem 1rem' }}
        onClick={() => setOpen(true)}
      >
        <Search size={14} style={{ color:'var(--text-secondary)', flexShrink:0 }} />
        <input
          style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'var(--text-primary)', fontSize:'0.9rem' }}
          placeholder={placeholder}
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onKeyDown={e => { if (e.key === 'Enter') { canAddCustom ? addCustom() : (filtered[0] && toggle(filtered[0])); } }}
        />
        <ChevronDown size={14} style={{ color:'var(--text-secondary)', flexShrink:0, transform: open ? 'rotate(180deg)' : 'none', transition:'0.2s' }} />
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{ position:'absolute', zIndex:999, top:'calc(100% + 4px)', left:0, right:0, background:'#1e293b', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'10px', maxHeight:'240px', overflowY:'auto', boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>

          {/* Add custom option */}
          {canAddCustom && (
            <div
              onClick={addCustom}
              style={{ padding:'0.7rem 1rem', cursor:'pointer', fontSize:'0.88rem', display:'flex', alignItems:'center', gap:'0.5rem', color:'#60a5fa', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(59,130,246,0.08)' }}
            >
              <Plus size={14}/> Add "<strong>{trimmed}</strong>"
            </div>
          )}

          {filtered.length === 0 && !canAddCustom && (
            <div style={{ padding:'1rem', color:'var(--text-secondary)', fontSize:'0.88rem', textAlign:'center' }}>No results</div>
          )}

          {filtered.map(opt => {
            const on = selected.includes(opt);
            return (
              <div key={opt} onClick={() => { toggle(opt); setQ(''); }}
                style={{ padding:'0.65rem 1rem', cursor:'pointer', fontSize:'0.88rem', display:'flex', alignItems:'center', justifyContent:'space-between',
                  background: on ? 'rgba(59,130,246,0.15)' : 'transparent',
                  color: on ? '#60a5fa' : 'var(--text-primary)',
                  borderBottom:'1px solid rgba(255,255,255,0.04)',
                  transition:'background 0.1s',
                }}>
                {opt}
                {on && <span style={{ color:'#60a5fa', fontSize:'0.8rem' }}>✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
