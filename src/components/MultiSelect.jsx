import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

const chipBase = {
  padding: '0.45rem 1rem', borderRadius: '9999px', fontSize: '0.88rem',
  fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem', userSelect: 'none',
};
const chipOff = { ...chipBase, borderColor: 'rgba(255,255,255,0.12)', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)' };
const chipOn  = { ...chipBase, borderColor: 'var(--accent-primary)', color: 'white', background: 'rgba(59,130,246,0.18)' };

/* Simple flat chip list */
export const ChipSelect = ({ options, selected = [], onChange, multi = true }) => {
  const toggle = (val) => {
    if (!multi) { onChange([val]); return; }
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {options.map(opt => {
        const on = selected.includes(opt);
        return <span key={opt} style={on ? chipOn : chipOff} onClick={() => toggle(opt)}>{on && '✓ '}{opt}</span>;
      })}
    </div>
  );
};

/* Categorised chip grid — {label, options[]}[] */
export const CategoryChips = ({ categories, selected = [], onChange, allowCustom = false, customLabel = 'Other' }) => {
  const [customVal, setCustomVal] = useState('');
  const toggle = (val) => onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  const addCustom = () => {
    const v = customVal.trim();
    if (v && !selected.includes(v)) { onChange([...selected, v]); }
    setCustomVal('');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {categories.map(cat => (
        <div key={cat.label}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{cat.label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {cat.options.map(opt => {
              const on = selected.includes(opt);
              return <span key={opt} style={on ? chipOn : chipOff} onClick={() => toggle(opt)}>{on && '✓ '}{opt}</span>;
            })}
          </div>
        </div>
      ))}
      {allowCustom && (
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{customLabel}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            {selected.filter(s => !categories.flatMap(c => c.options).includes(s)).map(s => (
              <span key={s} style={chipOn}>{s} <X size={12} onClick={(e) => { e.stopPropagation(); toggle(s); }} style={{ cursor: 'pointer' }} /></span>
            ))}
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <input
                className="input-field"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', width: '180px' }}
                placeholder="Type custom & press +"
                value={customVal}
                onChange={e => setCustomVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustom()}
              />
              <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={addCustom}><Plus size={14} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Selected tags bar */
export const SelectedTags = ({ selected, onRemove }) => {
  if (!selected.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
      {selected.map(s => (
        <span key={s} style={{ ...chipOn, fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}>
          {s} <X size={11} style={{ cursor: 'pointer', marginLeft: '2px' }} onClick={() => onRemove(s)} />
        </span>
      ))}
    </div>
  );
};

export default { ChipSelect, CategoryChips, SelectedTags };
