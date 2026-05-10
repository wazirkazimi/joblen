import React from 'react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 12 }, (_, i) => (currentYear - 8 + i).toString());

function calcDuration(sm, sy, em, ey, present) {
  if (!sm || !sy) return '';
  const start = new Date(`${sm} 1, ${sy}`);
  const end = present ? new Date() : (em && ey ? new Date(`${em} 1, ${ey}`) : null);
  if (!end) return '';
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (months < 0) months = 0;
  const yrs = Math.floor(months / 12);
  const mo = months % 12;
  const dur = [yrs && `${yrs} yr${yrs>1?'s':''}`, mo && `${mo} mo`].filter(Boolean).join(' ') || '< 1 mo';
  const endLabel = present ? 'Present' : `${em?.slice(0,3)} ${ey}`;
  return `${sm.slice(0,3)} ${sy} – ${endLabel} (${dur})`;
}

export default function DurationPicker({ value = {}, onChange }) {
  // value: { sm, sy, em, ey, present }
  const v = value;
  const set = (key, val) => {
    const next = { ...v, [key]: val };
    next.computed = calcDuration(next.sm, next.sy, next.em, next.ey, next.present);
    onChange(next);
  };

  const sel = (label, key, opts, width = '50%') => (
    <div style={{ width, paddingRight: '0.5rem' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{label}</div>
      <select
        className="input-field"
        style={{ padding: '0.6rem 0.75rem', fontSize: '0.9rem' }}
        value={v[key] || ''}
        onChange={e => set(key, e.target.value)}
      >
        <option value="">Select</option>
        {opts.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start date</div>
      <div style={{ display: 'flex', marginBottom: '0.75rem' }}>
        {sel('Month', 'sm', MONTHS, '60%')}
        {sel('Year *', 'sy', YEARS, '40%')}
      </div>

      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>End date</div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={v.present || false} onChange={e => set('present', e.target.checked)} />
        Currently ongoing / Present
      </label>
      {!v.present && (
        <div style={{ display: 'flex' }}>
          {sel('Month', 'em', MONTHS, '60%')}
          {sel('Year *', 'ey', YEARS, '40%')}
        </div>
      )}

      {v.computed && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--success)', fontWeight: 500 }}>
          📅 {v.computed}
        </div>
      )}
    </div>
  );
}
