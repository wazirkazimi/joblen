import React from 'react';
import { ChipSelect } from '../../components/MultiSelect';

const GOALS = [
  'Finding internships / first job',
  'Switching roles',
  'Upskilling + job hunting together',
  'Freelance / part-time work',
];

export default function Step1Goals({ formData, setFormData, errors = {} }) {
  const goals = formData.goals || [];
  const atMax = goals.length >= 2;

  const toggle = (val) => {
    if (goals.includes(val)) {
      setFormData({ ...formData, goals: goals.filter(g => g !== val) });
    } else {
      if (atMax) return; // max 2
      setFormData({ ...formData, goals: [...goals, val] });
    }
  };

  return (
    <div>
      <h3 className="mb-2" style={{ color: 'var(--accent-secondary)' }}>What are you here for? *</h3>
      <p className="mb-6" style={{ fontSize: '0.9rem' }}>Pick up to 2 goals that describe you best</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {GOALS.map(opt => {
          const on = goals.includes(opt);
          const disabled = !on && atMax;
          return (
            <div
              key={opt}
              onClick={() => !disabled && toggle(opt)}
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '10px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                border: on ? '2px solid var(--accent-primary)' : errors.goals ? '1px solid var(--danger)' : '1px solid var(--border-color)',
                background: on ? 'rgba(59,130,246,0.12)' : disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
                opacity: disabled ? 0.45 : 1,
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                fontWeight: on ? 600 : 400,
                color: on ? 'white' : 'var(--text-secondary)',
              }}
            >
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${on ? 'var(--accent-primary)' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {on && <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-primary)' }} />}
              </span>
              {opt}
            </div>
          );
        })}
      </div>
      {errors.goals && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '0.75rem' }}>⚠️ {errors.goals}</p>}
      {goals.length > 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.75rem' }}>{goals.length}/2 selected</p>}
    </div>
  );
}
