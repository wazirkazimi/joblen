import React from 'react';
import { ChipSelect } from '../../components/MultiSelect';
import SearchableDropdown from '../../components/SearchableDropdown';

const WORK_TYPES = ['Full-time','Part-time','Internship','Contract','Freelance','Remote','Hybrid','On-site'];
const AVAILABILITY = ['Immediately','Within 2 weeks','Within a month','In 2–3 months','After 3 months'];

// Comprehensive India states + major countries
const LOCATIONS = [
  // India – major cities
  'Bangalore, India','Mumbai, India','Delhi NCR, India','Hyderabad, India',
  'Pune, India','Chennai, India','Kolkata, India','Ahmedabad, India',
  'Jaipur, India','Surat, India','Lucknow, India','Chandigarh, India',
  'Kochi, India','Bhubaneswar, India','Indore, India','Coimbatore, India',
  // India – states
  'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha',
  'Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
  // Remote options
  'Remote – India','Remote – Anywhere','Open to Relocation',
  // International
  'Singapore','Dubai, UAE','Abu Dhabi, UAE','London, UK','New York, USA',
  'San Francisco, USA','Toronto, Canada','Sydney, Australia','Amsterdam, Netherlands',
  'Berlin, Germany','Paris, France','Tokyo, Japan','Bangkok, Thailand',
];

export default function Step6Prefs({ formData, setFormData, errors = {} }) {
  const p = formData.preferences || {};
  const set = (key, val) => setFormData({ ...formData, preferences: { ...p, [key]: val } });

  return (
    <div style={{ maxHeight:'460px', overflowY:'auto', paddingRight:'6px' }}>
      <h3 className="mb-2" style={{ color:'var(--accent-secondary)' }}>Your Preferences *</h3>
      <p className="mb-5" style={{ fontSize:'0.9rem' }}>Tell us what you're looking for — all fields required</p>

      <section style={{ marginBottom:'1.5rem' }}>
        <label className="input-label" style={{ display:'block',marginBottom:'0.6rem' }}>Work Type * <span style={{color:'var(--text-secondary)',fontWeight:400}}>(select all that apply)</span></label>
        {errors['preferences.workTypes'] && <p style={{color:'var(--danger)',fontSize:'0.82rem',marginBottom:'0.4rem'}}>⚠️ {errors['preferences.workTypes']}</p>}
        <ChipSelect options={WORK_TYPES} selected={p.workTypes||[]} onChange={val=>set('workTypes',val)} />
      </section>

      <section style={{ marginBottom:'1.5rem' }}>
        {errors['preferences.locations'] && <p style={{color:'var(--danger)',fontSize:'0.82rem',marginBottom:'0.4rem'}}>⚠️ {errors['preferences.locations']}</p>}
        <SearchableDropdown
          label="Preferred Locations"
          options={LOCATIONS}
          selected={p.locations||[]}
          onChange={val=>set('locations',val)}
          placeholder="Search city, state, or country…"
          required
        />
      </section>

      <section style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1.5rem' }}>
        <div className="input-group mb-0">
          <label className="input-label">Min Stipend / Salary *</label>
          <input className="input-field" placeholder="e.g. ₹15,000/mo or ₹8 LPA"
            value={p.stipend||''} onChange={e=>set('stipend',e.target.value)}
            style={{ borderColor: errors['preferences.stipend'] ? 'var(--danger)' : '' }} />
        </div>
        <div className="input-group mb-0">
          <label className="input-label" style={{display:'block',marginBottom:'0.5rem'}}>Availability *</label>
          {errors['preferences.availability'] && <p style={{color:'var(--danger)',fontSize:'0.78rem',marginBottom:'0.3rem'}}>⚠️ Required</p>}
          <ChipSelect options={AVAILABILITY} selected={p.availability?[p.availability]:[]} onChange={val=>set('availability',val[val.length-1]||'')} multi={false} />
        </div>
      </section>

      <div className="input-group mb-0">
        <label className="input-label" style={{ color:'var(--danger)' }}>Hard No's * – what would make you reject an offer instantly?</label>
        <textarea className="input-field"
          placeholder="e.g. Unpaid + no structure / No real ownership / 1AM calls…"
          value={p.hardNos||''} onChange={e=>set('hardNos',e.target.value)}
          style={{ minHeight:'80px', borderColor: errors['preferences.hardNos'] ? 'var(--danger)' : '' }} />
      </div>
    </div>
  );
}
