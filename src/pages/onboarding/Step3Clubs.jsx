import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import DurationPicker from '../../components/DurationPicker';
import SearchableDropdown from '../../components/SearchableDropdown';

const WORK_TYPE_OPTIONS = [
  'Growth / Marketing','Product','Tech / Dev','Content','Operations',
  'Design','Research','Community','Sales','Finance','Legal','HR',
  'Business Development','Strategy','Data & Analytics','Customer Success',
  'Education / Teaching','Event Management','Social Media','Fundraising',
];

const BLANK = { company:'', role:'', duration:{}, metric:'', types:[] };

export default function Step3Clubs({ formData, setFormData, errors = {} }) {
  const exps = formData.experiences?.length ? formData.experiences : [{ ...BLANK }];
  const [customTypeInputs, setCustomTypeInputs] = useState(exps.map(() => ''));

  const update = (idx, key, val) => {
    const next = exps.map((e, i) => i === idx ? { ...e, [key]: val } : e);
    setFormData({ ...formData, experiences: next });
  };

  const addCard = () => {
    setFormData({ ...formData, experiences: [...exps, { ...BLANK }] });
    setCustomTypeInputs(p => [...p, '']);
  };

  const removeCard = (idx) => {
    setFormData({ ...formData, experiences: exps.filter((_, i) => i !== idx) });
    setCustomTypeInputs(p => p.filter((_, i) => i !== idx));
  };

  const toggleType = (idx, val) => {
    const cur = exps[idx].types || [];
    update(idx, 'types', cur.includes(val) ? cur.filter(t => t !== val) : [...cur, val]);
  };

  const addCustomType = (idx) => {
    const val = customTypeInputs[idx]?.trim();
    if (!val) return;
    const cur = exps[idx].types || [];
    if (!cur.includes(val)) update(idx, 'types', [...cur, val]);
    setCustomTypeInputs(p => p.map((v, i) => i === idx ? '' : v));
  };

  const chipOn  = { display:'inline-flex',alignItems:'center',gap:'0.3rem',padding:'0.35rem 0.85rem',borderRadius:'9999px',fontSize:'0.82rem',fontWeight:500,cursor:'pointer',border:'1px solid var(--accent-primary)',color:'white',background:'rgba(59,130,246,0.18)' };
  const chipOff = { display:'inline-flex',alignItems:'center',gap:'0.3rem',padding:'0.35rem 0.85rem',borderRadius:'9999px',fontSize:'0.82rem',fontWeight:500,cursor:'pointer',border:'1px solid rgba(255,255,255,0.12)',color:'var(--text-secondary)',background:'rgba(255,255,255,0.04)' };

  return (
    <div>
      <h3 className="mb-2" style={{ color:'var(--accent-secondary)' }}>Clubs & Contributions *</h3>
      <p className="mb-5" style={{ fontSize:'0.9rem' }}>Add clubs, projects, internships or open-source work. At least 1 required.</p>

      <div style={{ display:'flex',flexDirection:'column',gap:'1rem',maxHeight:'430px',overflowY:'auto',paddingRight:'6px' }}>
        {exps.map((exp, idx) => (
          <div key={idx} style={{ padding:'1.25rem',background:'rgba(0,0,0,0.25)',borderRadius:'10px',border: errors[`exp_${idx}`] ? '1px solid var(--danger)' : '1px solid var(--border-color)',position:'relative' }}>

            {exps.length > 1 && (
              <button type="button" onClick={() => removeCard(idx)}
                style={{ position:'absolute',top:'0.75rem',right:'0.75rem',background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'6px',padding:'0.25rem 0.6rem',cursor:'pointer',color:'var(--danger)',display:'flex',alignItems:'center',gap:'0.3rem',fontSize:'0.78rem' }}>
                <Trash2 size={12}/> Remove
              </button>
            )}

            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginTop: exps.length > 1 ? '1.75rem' : 0 }}>
              <div className="input-group mb-1">
                <label className="input-label">Org / Club / Project *</label>
                <input className="input-field" placeholder="E.g. E-Cell, Open Source" value={exp.company} onChange={e=>update(idx,'company',e.target.value)}
                  style={{ borderColor: errors[`exp_${idx}_company`] ? 'var(--danger)' : '' }} />
              </div>
              <div className="input-group mb-1">
                <label className="input-label">Your Role / Position *</label>
                <input className="input-field" placeholder="E.g. Core Member, Lead Dev" value={exp.role} onChange={e=>update(idx,'role',e.target.value)}
                  style={{ borderColor: errors[`exp_${idx}_role`] ? 'var(--danger)' : '' }} />
              </div>
            </div>

            <div className="input-group mb-3">
              <label className="input-label">Duration *</label>
              <DurationPicker value={exp.duration||{}} onChange={val=>update(idx,'duration',val)} />
            </div>

            <div className="input-group mb-3">
              <label className="input-label" style={{ color:'var(--warning)' }}>One metric / outcome * (required — quantify it!)</label>
              <input className="input-field" placeholder="E.g. Organised event for 500+ students, drove 20% growth"
                value={exp.metric} onChange={e=>update(idx,'metric',e.target.value)}
                style={{ borderColor: errors[`exp_${idx}_metric`] ? 'var(--danger)' : '' }} />
            </div>

            <div>
              <label className="input-label" style={{ display:'block', marginBottom:'0.6rem' }}>Type of work * <span style={{color:'var(--text-secondary)',fontWeight:400}}>(search or add custom)</span></label>
              {errors[`exp_${idx}_types`] && <p style={{color:'var(--danger)',fontSize:'0.78rem',marginBottom:'0.4rem'}}>⚠️ Select at least one type</p>}
              <SearchableDropdown
                options={WORK_TYPE_OPTIONS}
                selected={exp.types||[]}
                onChange={val => update(idx, 'types', val)}
                placeholder="Search type (Product, Design, Tech…) or add custom"
              />
            </div>
          </div>
        ))}
      </div>

      {exps.length < 5 && (
        <button type="button" className="btn btn-secondary" style={{ width:'100%',marginTop:'0.75rem',justifyContent:'center' }} onClick={addCard}>
          <Plus size={15}/> Add Another Contribution
        </button>
      )}
    </div>
  );
}
