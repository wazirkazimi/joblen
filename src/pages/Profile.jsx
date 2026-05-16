import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MapPin, GraduationCap, Briefcase, Globe, Calendar, ExternalLink, GitBranch, Link2, Plus, Trash2 } from 'lucide-react';
import EditCard from '../components/EditCard';
import SearchableDropdown from '../components/SearchableDropdown';
import { ChipSelect } from '../components/MultiSelect';

// ── tiny helpers ─────────────────────────────────────────────────────────────
const Chip = ({ label }) => (
  <span style={{ display:'inline-block', padding:'0.25rem 0.75rem', borderRadius:'9999px', fontSize:'0.8rem', fontWeight:500, background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', margin:'0.15rem' }}>{label}</span>
);
const ST = ({ children }) => (
  <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0.75rem 0 0.4rem' }}>{children}</div>
);
const Inp = ({ label, value, onChange, as='input', ...rest }) => (
  <div style={{ marginBottom:'0.75rem' }}>
    {label && <label style={{ display:'block', fontSize:'0.8rem', fontWeight:600, color:'#64748b', marginBottom:'0.25rem' }}>{label}</label>}
    {as === 'textarea'
      ? <textarea value={value} onChange={onChange} style={{ width:'100%', padding:'0.6rem 0.75rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9rem', color:'#0f172a', background:'#f8fafc', resize:'vertical', minHeight:'90px', boxSizing:'border-box', fontFamily:'inherit' }} {...rest}/>
      : <input value={value} onChange={onChange} style={{ width:'100%', padding:'0.6rem 0.75rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9rem', color:'#0f172a', background:'#f8fafc', boxSizing:'border-box' }} {...rest}/>
    }
  </div>
);

const GOALS_LIST = ['Finding internships / first job','Switching roles','Upskilling + job hunting together','Freelance / part-time work'];
const WORK_TYPES = ['Full-time','Part-time','Internship','Contract','Freelance','Remote','Hybrid','On-site'];
const AVAIL_LIST = ['Immediately','Within 2 weeks','Within a month','In 2–3 months','After 3 months'];
const EMPLOYED_OPTS = ['No – actively looking','Yes – open to opportunities','Freelancing'];
const ALL_SKILLS = ['HTML/CSS','JavaScript','TypeScript','React','Next.js','Vue.js','Node.js','Python','Java','Go','SQL','PostgreSQL','MongoDB','Docker','AWS','Figma','Adobe XD','SEO','Google Analytics','Excel','PowerPoint','Canva'];
const ALL_TOOLS  = ['Notion','Airtable','Jira','Linear','Google Sheets','Tableau','VS Code','GitHub','Postman','Vercel','n8n','Zapier','Slack','Loom','Miro'];
const ALL_AI     = ['ChatGPT','Claude','Gemini','Perplexity','GitHub Copilot','Cursor AI','Midjourney','DALL·E','Notion AI','ElevenLabs'];
const ALL_ROLES  = ['Frontend Engineer','Backend Engineer','Full Stack Engineer','Mobile Developer','Product Manager','Product Intern','UI/UX Designer','Data Analyst','Growth Intern','Operations Intern','Business Development','Content Creator','Data Scientist','ML Engineer'];
const ALL_INDUSTRIES = ['SaaS / B2B','Consumer Apps','AI / ML','Edtech','Fintech','Healthtech','D2C / E-commerce','Gaming / Esports','Climate / GreenTech','Early-stage startup','Series A/B','MNC / Large Corp'];
const LOCATIONS  = ['Bangalore, India','Mumbai, India','Delhi NCR, India','Hyderabad, India','Pune, India','Chennai, India','Remote – India','Remote – Anywhere','Open to Relocation','Singapore','Dubai, UAE','London, UK'];

// completeness
const CHECKS = [p=>p?.goals?.length, p=>p?.profile?.name, p=>p?.profile?.city, p=>p?.profile?.education, p=>p?.selectedSkills?.length>=3, p=>p?.targetRoles?.length, p=>p?.industries?.length, p=>p?.preferences?.workTypes?.length, p=>p?.preferences?.locations?.length, p=>p?.preferences?.stipend, p=>p?.personalitySignal?.length>=20];
const getMissing = (p) => {
  const labels = ['Career Goals','Full Name','City','Education','Hard Skills (min 3)','Target Roles','Industries','Work Type','Locations','Min Stipend','Personality Signal'];
  return labels.filter((_,i) => !CHECKS[i]?.(p));
};

export default function Profile() {
  const { profile, saveProfile, user } = useAuth();
  const navigate = useNavigate();

  // drafts for each section
  const [draftBasic,  setDraftBasic]  = useState(null);
  const [draftGoals,  setDraftGoals]  = useState(null);
  const [draftSkills, setDraftSkills] = useState(null);
  const [draftRoles,  setDraftRoles]  = useState(null);
  const [draftPrefs,  setDraftPrefs]  = useState(null);
  const [draftSignal, setDraftSignal] = useState(null);
  const [draftLinks,  setDraftLinks]  = useState(null);
  const [draftExps,   setDraftExps]   = useState(null);

  if (!profile) return (
    <div style={{ textAlign:'center', padding:'4rem 2rem', color:'#64748b' }}>
      <h2>No profile yet</h2>
      <button onClick={() => navigate('/onboarding')} style={{ marginTop:'1rem', padding:'0.75rem 2rem', background:'#2563eb', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:600 }}>Complete Onboarding</button>
    </div>
  );

  const p   = profile.profile || {};
  const pr  = profile.preferences || {};
  const lnk = profile.links || {};
  const missing = getMissing(profile);
  const pct = Math.round(((CHECKS.length - missing.length) / CHECKS.length) * 100);

  const save = (patch) => saveProfile({ ...profile, ...patch });

  return (
    <div style={{ maxWidth:'920px', margin:'0 auto', fontFamily:'Inter,system-ui,sans-serif', paddingTop:'1rem' }}>
      <style>{`
        @media (max-width: 768px) {
          .profile-grid { grid-template-columns: 1fr !important; }
          .profile-completeness-row { flex-direction: column !important; gap: 0.5rem !important; }
        }
        @media (max-width: 480px) {
          .profile-grid { gap: 0.75rem !important; }
        }
      `}</style>
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>

        {/* Header */}
        <div style={{ marginBottom:'1.5rem' }}>
          <h1 style={{ fontSize:'1.8rem', fontWeight:700, color:'#0f172a', marginBottom:'0.2rem' }}>My Profile</h1>
          <p style={{ color:'#64748b', fontSize:'0.88rem' }}>{user?.email}</p>
        </div>

        {/* Completeness */}
        {missing.length > 0 && (
          <div style={{ background:'#fffbeb', border:'1px solid #fbbf24', borderRadius:'12px', padding:'1.25rem 1.5rem', marginBottom:'1.5rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
              <span style={{ fontWeight:700, color:'#92400e', display:'flex', alignItems:'center', gap:'0.4rem' }}><AlertCircle size={16}/> {pct}% Complete</span>
            </div>
            <div style={{ height:'5px', background:'#fde68a', borderRadius:'9999px', overflow:'hidden', marginBottom:'0.6rem' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:'#d97706' }} />
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.3rem' }}>
              {missing.map(m => <span key={m} style={{ padding:'0.15rem 0.6rem', borderRadius:'9999px', fontSize:'0.73rem', background:'#fef3c7', border:'1px solid #fbbf24', color:'#92400e' }}>Missing: {m}</span>)}
            </div>
          </div>
        )}

        <div className="profile-grid" style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:'1.25rem', alignItems:'start' }}>

          {/* LEFT column */}
          <div>
            {/* Basic Info */}
            <EditCard title="👤 Basic Info"
              onSave={() => save({ profile: { ...p, ...draftBasic } })}
              renderEdit={() => {
                if (!draftBasic) setDraftBasic({ name:p.name||'', city:p.city||'', education:p.education||'', gradYear:p.gradYear||'', employed:p.employed||'' });
                return draftBasic ? (
                  <div>
                    <Inp label="Full Name"    value={draftBasic.name}      onChange={e=>setDraftBasic({...draftBasic,name:e.target.value})} placeholder="Your name"/>
                    <Inp label="City"         value={draftBasic.city}      onChange={e=>setDraftBasic({...draftBasic,city:e.target.value})} placeholder="Bangalore"/>
                    <Inp label="Education"    value={draftBasic.education} onChange={e=>setDraftBasic({...draftBasic,education:e.target.value})} placeholder="B.Tech, IIT Bombay"/>
                    <Inp label="Grad Year"    value={draftBasic.gradYear}  onChange={e=>setDraftBasic({...draftBasic,gradYear:e.target.value})} placeholder="2026"/>
                    <div style={{ marginBottom:'0.75rem' }}>
                      <label style={{ display:'block', fontSize:'0.8rem', fontWeight:600, color:'#64748b', marginBottom:'0.25rem' }}>Employment Status</label>
                      <select value={draftBasic.employed} onChange={e=>setDraftBasic({...draftBasic,employed:e.target.value})} style={{ width:'100%', padding:'0.6rem 0.75rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9rem', background:'#f8fafc' }}>
                        <option value="">Select…</option>
                        {EMPLOYED_OPTS.map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                ) : null;
              }}>
              {/* view mode */}
              <div style={{ fontSize:'0.88rem', color:'#334155', lineHeight:2 }}>
                {p.name && <div><span style={{ color:'#94a3b8', width:'90px', display:'inline-block' }}>Name</span> {p.name}</div>}
                {p.city && <div><span style={{ color:'#94a3b8', width:'90px', display:'inline-block' }}><MapPin size={11} style={{marginRight:'3px'}}/>City</span> {p.city}</div>}
                {p.education && <div><span style={{ color:'#94a3b8', width:'90px', display:'inline-block' }}><GraduationCap size={11} style={{marginRight:'3px'}}/>Edu</span> {p.education}</div>}
                {p.gradYear && <div><span style={{ color:'#94a3b8', width:'90px', display:'inline-block' }}>Grad</span> {p.gradYear}</div>}
                {p.employed && <div style={{ marginTop:'0.5rem' }}><span style={{ padding:'0.25rem 0.75rem', borderRadius:'9999px', background:'#dcfce7', color:'#166534', fontSize:'0.78rem', fontWeight:600 }}>● {p.employed}</span></div>}
              </div>
            </EditCard>

            {/* Goals */}
            <EditCard title="🎯 Career Goals"
              onSave={() => save({ goals: draftGoals })}
              renderEdit={() => {
                if (!draftGoals) setDraftGoals(profile.goals || []);
                return draftGoals ? <ChipSelect options={GOALS_LIST} selected={draftGoals} onChange={setDraftGoals} /> : null;
              }}>
              {profile.goals?.length ? profile.goals.map(g=><Chip key={g} label={g}/>) : <span style={{ color:'#94a3b8', fontSize:'0.85rem' }}>Not set</span>}
            </EditCard>

            {/* Preferences */}
            <EditCard title="⚙️ Preferences"
              onSave={() => save({ preferences: { ...pr, ...draftPrefs } })}
              renderEdit={() => {
                if (!draftPrefs) setDraftPrefs({ workTypes:pr.workTypes||[], locations:pr.locations||[], stipend:pr.stipend||'', availability:pr.availability||'', hardNos:pr.hardNos||'' });
                return draftPrefs ? (
                  <div>
                    <ST>Work Type</ST>
                    <ChipSelect options={WORK_TYPES} selected={draftPrefs.workTypes} onChange={v=>setDraftPrefs({...draftPrefs,workTypes:v})}/>
                    <ST>Availability</ST>
                    <ChipSelect options={AVAIL_LIST} selected={draftPrefs.availability?[draftPrefs.availability]:[]} onChange={v=>setDraftPrefs({...draftPrefs,availability:v[v.length-1]||''})} multi={false}/>
                    <ST>Locations</ST>
                    <SearchableDropdown options={LOCATIONS} selected={draftPrefs.locations} onChange={v=>setDraftPrefs({...draftPrefs,locations:v})} placeholder="Search locations…"/>
                    <ST>Min Stipend / Salary</ST>
                    <Inp value={draftPrefs.stipend} onChange={e=>setDraftPrefs({...draftPrefs,stipend:e.target.value})} placeholder="₹15,000/mo or ₹8 LPA"/>
                    <ST>Hard No's</ST>
                    <Inp as="textarea" value={draftPrefs.hardNos} onChange={e=>setDraftPrefs({...draftPrefs,hardNos:e.target.value})} placeholder="What would make you instantly reject?"/>
                  </div>
                ) : null;
              }}>
              {pr.workTypes?.length ? <div style={{marginBottom:'0.4rem'}}>{pr.workTypes.map(t=><Chip key={t} label={t}/>)}</div> : null}
              {pr.locations?.length ? <div style={{marginBottom:'0.4rem'}}>{pr.locations.slice(0,3).map(l=><Chip key={l} label={l}/>)}{pr.locations.length>3&&<Chip label={`+${pr.locations.length-3}`}/>}</div> : null}
              {pr.stipend && <div style={{fontSize:'0.85rem',color:'#334155',marginTop:'0.3rem'}}>💰 {pr.stipend}</div>}
              {pr.availability && <div style={{fontSize:'0.82rem',color:'#64748b',marginTop:'0.2rem'}}>⏰ {pr.availability}</div>}
              {!pr.workTypes?.length && !pr.stipend && <span style={{color:'#94a3b8',fontSize:'0.85rem'}}>Not set</span>}
            </EditCard>

            {/* Links */}
            <EditCard title="🔗 Links"
              onSave={() => save({ links: { ...lnk, ...draftLinks } })}
              renderEdit={() => {
                if (!draftLinks) setDraftLinks({ portfolio:lnk.portfolio||'', github:lnk.github||'', linkedin:lnk.linkedin||'', otherDoc:lnk.otherDoc||'' });
                return draftLinks ? (
                  <div>
                    <Inp label="Portfolio / Website" value={draftLinks.portfolio} onChange={e=>setDraftLinks({...draftLinks,portfolio:e.target.value})} placeholder="https://yoursite.com"/>
                    <Inp label="GitHub"              value={draftLinks.github}    onChange={e=>setDraftLinks({...draftLinks,github:e.target.value})}    placeholder="https://github.com/"/>
                    <Inp label="LinkedIn"            value={draftLinks.linkedin}  onChange={e=>setDraftLinks({...draftLinks,linkedin:e.target.value})}  placeholder="https://linkedin.com/in/"/>
                    <Inp label="Notion / Case Study" value={draftLinks.otherDoc}  onChange={e=>setDraftLinks({...draftLinks,otherDoc:e.target.value})}  placeholder="https://notion.so/"/>
                  </div>
                ) : null;
              }}>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                {lnk.portfolio && <a href={lnk.portfolio} target="_blank" rel="noreferrer" style={{ fontSize:'0.85rem', color:'#2563eb', display:'flex', alignItems:'center', gap:'0.3rem', textDecoration:'none' }}><Globe size={13}/> Portfolio <ExternalLink size={10}/></a>}
                {lnk.github    && <a href={lnk.github}    target="_blank" rel="noreferrer" style={{ fontSize:'0.85rem', color:'#2563eb', display:'flex', alignItems:'center', gap:'0.3rem', textDecoration:'none' }}><GitBranch size={13}/> GitHub <ExternalLink size={10}/></a>}
                {lnk.linkedin  && <a href={lnk.linkedin}  target="_blank" rel="noreferrer" style={{ fontSize:'0.85rem', color:'#2563eb', display:'flex', alignItems:'center', gap:'0.3rem', textDecoration:'none' }}><Link2 size={13}/> LinkedIn <ExternalLink size={10}/></a>}
                {!lnk.portfolio && !lnk.github && !lnk.linkedin && <span style={{ color:'#94a3b8', fontSize:'0.85rem' }}>No links added</span>}
              </div>
            </EditCard>
          </div>

          {/* RIGHT column */}
          <div>
            {/* Personality Signal */}
            <EditCard title="🌟 Personality Signal"
              onSave={() => save({ personalitySignal: draftSignal })}
              renderEdit={() => {
                if (draftSignal === null) setDraftSignal(profile.personalitySignal || '');
                return <Inp as="textarea" value={draftSignal||''} onChange={e=>setDraftSignal(e.target.value)} placeholder="Your proudest achievement with context, what you did, and the result…" style={{ minHeight:'120px' }}/>;
              }}>
              {profile.personalitySignal ? <p style={{ fontSize:'0.9rem', color:'#334155', lineHeight:1.7, margin:0 }}>{profile.personalitySignal}</p> : <span style={{ color:'#94a3b8', fontSize:'0.85rem' }}>Not set</span>}
            </EditCard>

            {/* Skills */}
            <EditCard title="💡 Skills & Tools"
              onSave={() => save({ selectedSkills:draftSkills?.skills, softSkills:draftSkills?.soft, selectedTools:draftSkills?.tools, selectedAiTools:draftSkills?.ai })}
              renderEdit={() => {
                if (!draftSkills) setDraftSkills({ skills:profile.selectedSkills||[], soft:profile.softSkills||[], tools:profile.selectedTools||[], ai:profile.selectedAiTools||[] });
                return draftSkills ? (
                  <div>
                    <ST>Hard Skills</ST>
                    <SearchableDropdown options={ALL_SKILLS} selected={draftSkills.skills} onChange={v=>setDraftSkills({...draftSkills,skills:v})} placeholder="Search or add skills…"/>
                    <ST>Daily Tools</ST>
                    <SearchableDropdown options={ALL_TOOLS} selected={draftSkills.tools} onChange={v=>setDraftSkills({...draftSkills,tools:v})} placeholder="Search or add tools…"/>
                    <ST>AI Tools</ST>
                    <SearchableDropdown options={ALL_AI} selected={draftSkills.ai} onChange={v=>setDraftSkills({...draftSkills,ai:v})} placeholder="Search AI tools…"/>
                  </div>
                ) : null;
              }}>
              {profile.selectedSkills?.length > 0 && (<><ST>Hard Skills</ST><div>{profile.selectedSkills.map(s=><Chip key={s} label={s}/>)}</div></>)}
              {profile.selectedTools?.length   > 0 && (<><ST>Daily Tools</ST><div>{profile.selectedTools.map(s=><Chip key={s} label={s}/>)}</div></>)}
              {profile.selectedAiTools?.length > 0 && (<><ST>AI Tools</ST><div>{profile.selectedAiTools.map(s=><Chip key={s} label={s}/>)}</div></>)}
              {!profile.selectedSkills?.length && !profile.selectedTools?.length && <span style={{ color:'#94a3b8', fontSize:'0.85rem' }}>Not set</span>}
            </EditCard>

            {/* Roles & Industries */}
            <EditCard title="💼 Target Roles & Industries"
              onSave={() => save({ targetRoles:draftRoles?.roles, industries:draftRoles?.industries })}
              renderEdit={() => {
                if (!draftRoles) setDraftRoles({ roles:profile.targetRoles||[], industries:profile.industries||[] });
                return draftRoles ? (
                  <div>
                    <ST>Target Roles</ST>
                    <SearchableDropdown options={ALL_ROLES} selected={draftRoles.roles} onChange={v=>setDraftRoles({...draftRoles,roles:v})} placeholder="Search roles…"/>
                    <ST>Industries</ST>
                    <SearchableDropdown options={ALL_INDUSTRIES} selected={draftRoles.industries} onChange={v=>setDraftRoles({...draftRoles,industries:v})} placeholder="Search industries…"/>
                  </div>
                ) : null;
              }}>
              {profile.targetRoles?.length > 0 && (<><ST>Roles</ST><div>{profile.targetRoles.map(r=><Chip key={r} label={r}/>)}</div></>)}
              {profile.industries?.length  > 0 && (<><ST>Industries</ST><div>{profile.industries.map(i=><Chip key={i} label={i}/>)}</div></>)}
              {!profile.targetRoles?.length && !profile.industries?.length && <span style={{ color:'#94a3b8', fontSize:'0.85rem' }}>Not set</span>}
            </EditCard>

            {/* Clubs & Contributions */}
            <EditCard title="🏆 Clubs & Contributions"
              onSave={() => save({ experiences: draftExps })}
              renderEdit={() => {
                if (!draftExps) setDraftExps(profile.experiences?.length ? JSON.parse(JSON.stringify(profile.experiences)) : []);
                const upd = (i,k,v) => { const n=[...draftExps]; n[i]={...n[i],[k]:v}; setDraftExps(n); };
                return draftExps ? (
                  <div>
                    {draftExps.map((exp,i) => (
                      <div key={i} style={{ padding:'0.85rem', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', marginBottom:'0.75rem', position:'relative' }}>
                        <button onClick={()=>setDraftExps(draftExps.filter((_,j)=>j!==i))} style={{ position:'absolute', top:'0.5rem', right:'0.5rem', background:'#fee2e2', border:'none', borderRadius:'4px', padding:'0.2rem 0.4rem', cursor:'pointer', color:'#dc2626' }}><Trash2 size={12}/></button>
                        <Inp label="Org / Club / Project" value={exp.company||''} onChange={e=>upd(i,'company',e.target.value)} placeholder="E-Cell, Open Source…"/>
                        <Inp label="Your Role"            value={exp.role||''}    onChange={e=>upd(i,'role',e.target.value)}    placeholder="Core Member, Lead Dev…"/>
                        <Inp label="Metric / Outcome"     value={exp.metric||''}  onChange={e=>upd(i,'metric',e.target.value)}  placeholder="Organized event for 500+ students…"/>
                      </div>
                    ))}
                    <button onClick={()=>setDraftExps([...draftExps,{company:'',role:'',metric:'',types:[],duration:{}}])}
                      style={{ width:'100%', padding:'0.6rem', border:'2px dashed #cbd5e1', borderRadius:'8px', background:'transparent', cursor:'pointer', color:'#64748b', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem', fontSize:'0.85rem' }}>
                      <Plus size={14}/> Add Contribution
                    </button>
                  </div>
                ) : null;
              }}>
              {profile.experiences?.map((exp,i) => (
                <div key={i} style={{ display:'flex', gap:'0.75rem', paddingBottom:'0.85rem', marginBottom:'0.85rem', borderBottom: i<profile.experiences.length-1?'1px solid #f1f5f9':'none' }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'8px', background:'#f1f5f9', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Briefcase size={15} color="#64748b"/></div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.9rem', color:'#0f172a' }}>{exp.role}</div>
                    <div style={{ fontSize:'0.82rem', color:'#2563eb', fontWeight:500 }}>{exp.company}</div>
                    {exp.duration?.computed && <div style={{ fontSize:'0.75rem', color:'#94a3b8', display:'flex', alignItems:'center', gap:'0.2rem' }}><Calendar size={10}/>{exp.duration.computed}</div>}
                    {exp.metric && <div style={{ fontSize:'0.82rem', color:'#475569', marginTop:'0.2rem' }}>📊 {exp.metric}</div>}
                  </div>
                </div>
              ))}
              {!profile.experiences?.length && <span style={{ color:'#94a3b8', fontSize:'0.85rem' }}>No contributions added</span>}
            </EditCard>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* Injected styles for mobile responsiveness */
const _ProfileStyles = () => (
  <style>{`
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 768px) {
      .profile-grid { grid-template-columns: 1fr !important; }
    }
  `}</style>
);
