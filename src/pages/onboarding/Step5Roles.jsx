import React from 'react';
import SearchableDropdown from '../../components/SearchableDropdown';
import { CategoryChips } from '../../components/MultiSelect';

// Flat searchable list for roles (technical + non-technical)
const ALL_ROLES = [
  // Engineering
  'Frontend Engineer','Backend Engineer','Full Stack Engineer','Mobile Developer',
  'iOS Developer','Android Developer','DevOps Engineer','Data Engineer',
  'Embedded Engineer','QA Engineer','Security Engineer','Blockchain Developer',
  // Product
  'Product Manager','Product Intern','Product Analyst','Chief of Staff',"Founder's Office",
  'Business Analyst','Program Manager',
  // Design
  'UI/UX Designer','Product Designer','Graphic Designer','Motion Designer','Brand Designer',
  // Growth & Marketing
  'Growth Intern','Performance Marketer','Social Media Manager','Content Creator',
  'SEO Specialist','Brand Strategist','Email Marketer','Influencer Marketing',
  // Operations & Business
  'Operations Intern','Business Development','Sales Associate','Account Manager',
  'Community Manager','Customer Success','HR Intern','Finance Intern',
  // Data & AI
  'Data Analyst','Data Scientist','ML Engineer','AI Engineer','Prompt Engineer','Research Analyst',
  // Other
  'Freelancer','Consultant','Startup Generalist','Open to anything early-stage',
];

const INDUSTRY_CATS = [
  { label:'Tech', options:['SaaS / B2B','Consumer Apps','Developer Tools','Open Source','E-commerce'] },
  { label:'Emerging Tech', options:['AI / ML','Blockchain / Web3','Defense / Deep Tech','Climate / GreenTech','Space Tech'] },
  { label:'Consumer', options:['D2C / Retail','Gaming / Esports','Creator Economy','Social Media','OTT / Media'] },
  { label:'Vertical SaaS', options:['Edtech','Fintech','Healthtech / Biotech','Proptech / Real Estate','Legaltech','Insurtech','Agritech'] },
  { label:'Traditional', options:['FMCG','Logistics / Supply Chain','Manufacturing','Banking / NBFC','Consulting'] },
  { label:'Company Stage', options:['Early-stage startup (0–10 people)','Seed stage (10–50)','Series A/B (50–200)','Large corp / MNC'] },
];

export default function Step5Roles({ formData, setFormData, errors = {} }) {
  return (
    <div style={{ maxHeight:'460px', overflowY:'auto', paddingRight:'6px' }}>
      <h3 className="mb-2" style={{ color:'var(--accent-secondary)' }}>Target Roles & Industries *</h3>
      <p className="mb-5" style={{ fontSize:'0.9rem' }}>Search or browse — select everything that interests you</p>

      <section style={{ marginBottom:'2rem' }}>
        <div style={{ fontSize:'1rem',fontWeight:600,marginBottom:'0.5rem',paddingBottom:'0.5rem',borderBottom:'1px solid var(--border-color)' }}>💼 Target Roles</div>
        <p style={{ fontSize:'0.82rem',color:'var(--text-secondary)',marginBottom:'0.75rem' }}>Works for both technical & non-technical roles</p>
        {errors.targetRoles && <p style={{color:'var(--danger)',fontSize:'0.82rem',marginBottom:'0.5rem'}}>⚠️ {errors.targetRoles}</p>}
        <SearchableDropdown
          options={ALL_ROLES}
          selected={formData.targetRoles||[]}
          onChange={val => setFormData({...formData, targetRoles: val})}
          placeholder="Search roles (Product Manager, Designer, Dev…)"
        />
      </section>

      <section>
        <div style={{ fontSize:'1rem',fontWeight:600,marginBottom:'1rem',paddingBottom:'0.5rem',borderBottom:'1px solid var(--border-color)' }}>🏢 Industries That Excite You</div>
        {errors.industries && <p style={{color:'var(--danger)',fontSize:'0.82rem',marginBottom:'0.5rem'}}>⚠️ {errors.industries}</p>}
        <CategoryChips
          categories={INDUSTRY_CATS}
          selected={formData.industries||[]}
          onChange={val => setFormData({...formData, industries: val})}
          allowCustom customLabel="Add Custom Industry"
        />
      </section>
    </div>
  );
}
