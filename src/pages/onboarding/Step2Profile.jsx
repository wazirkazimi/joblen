import React from 'react';

export default function Step2Profile({ formData, setFormData }) {
  const p = formData.profile;
  const set = (key, val) => setFormData({ ...formData, profile: { ...p, [key]: val } });
  const inp = (label, key, placeholder='', type='text', full=false) => (
    <div className="input-group" style={full ? {gridColumn:'1/span 2'} : {}}>
      <label className="input-label">{label} *</label>
      <input className="input-field" type={type} placeholder={placeholder} value={p[key]||''} onChange={e=>set(key,e.target.value)} required />
    </div>
  );
  return (
    <div>
      <h3 className="mb-2" style={{color:'var(--accent-secondary)'}}>Tell us about yourself *</h3>
      <p className="mb-6" style={{fontSize:'0.9rem'}}>All fields are required</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
        {inp('Full Name','name','Wazir Kazimi')}
        {inp('Current City','city','Bangalore')}
        {inp('Degree & College','education','B.Tech, IIT Bombay')}
        {inp('Graduating When?','gradYear','May 2026')}
        <div className="input-group" style={{gridColumn:'1/span 2'}}>
          <label className="input-label">Currently Employed? *</label>
          <select className="input-field" value={p.employed||''} onChange={e=>set('employed',e.target.value)} required>
            <option value="">Select...</option>
            <option>No – actively looking</option>
            <option>Yes – open to opportunities</option>
            <option>Freelancing</option>
          </select>
        </div>
      </div>
    </div>
  );
}
