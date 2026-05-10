import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, ChevronLeft, UploadCloud, SkipForward, FileText, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BACKEND_URL from '../lib/config';
import Step1Goals   from './onboarding/Step1Goals';
import Step2Profile from './onboarding/Step2Profile';
import Step3Clubs   from './onboarding/Step3Clubs';
import Step4Skills  from './onboarding/Step4Skills';
import Step5Roles   from './onboarding/Step5Roles';
import Step6Prefs   from './onboarding/Step6Prefs';

const TITLES = ['Upload Resume','Your Goals','Basic Info','Clubs & Contributions','Skills & Tools','Roles & Industries','Preferences','Proof of Work','Your Story'];
const BLANK_EXP = { company:'', role:'', duration:{}, metric:'', types:[] };

function validateStep(step, fd) {
  const errs = {};
  const p  = fd.profile || {};
  const pr = fd.preferences || {};

  if (step === 1) {
    if (!fd.goals?.length) errs.goals = 'Select at least 1 goal (max 2)';
  }
  if (step === 2) {
    if (!p.name)      errs['profile.name']      = 'Name is required';
    if (!p.city)      errs['profile.city']      = 'City is required';
    if (!p.education) errs['profile.education'] = 'Education is required';
    if (!p.gradYear)  errs['profile.gradYear']  = 'Graduation year is required';
    if (!p.employed)  errs['profile.employed']  = 'Employment status is required';
  }
  if (step === 3) {
    (fd.experiences||[]).forEach((e, i) => {
      if (!e.company) errs[`exp_${i}_company`] = true;
      if (!e.role)    errs[`exp_${i}_role`]    = true;
      if (!e.metric)  errs[`exp_${i}_metric`]  = true;
      if (!(e.types||[]).length) errs[`exp_${i}_types`] = true;
      if (!e.duration?.sy) errs[`exp_${i}_duration`] = true;
    });
  }
  if (step === 4) {
    if (!(fd.selectedSkills?.length >= 3)) errs.selectedSkills = 'Select at least 3 skills';
  }
  if (step === 5) {
    if (!fd.targetRoles?.length)  errs.targetRoles  = 'Select at least 1 role';
    if (!fd.industries?.length)   errs.industries   = 'Select at least 1 industry';
  }
  if (step === 6) {
    if (!pr.workTypes?.length)  errs['preferences.workTypes']    = 'Select at least 1 work type';
    if (!pr.locations?.length)  errs['preferences.locations']    = 'Select at least 1 location';
    if (!pr.stipend)            errs['preferences.stipend']      = 'Required';
    if (!pr.availability)       errs['preferences.availability'] = 'Required';
    if (!pr.hardNos)            errs['preferences.hardNos']      = 'Required';
  }
  if (step === 7) {
    if (!fd.links?.resumeText) errs['links.resumeText'] = 'Paste your resume text';
  }
  if (step === 8) {
    if (!fd.personalitySignal || fd.personalitySignal.length < 50)
      errs.personalitySignal = 'Write at least 50 characters';
  }
  return errs;
}

export default function Onboarding() {
  const [step, setStep]       = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving]   = useState(false);
  const [saveError, setSaveError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();
  const { saveProfile } = useAuth();

  const [formData, setFormData] = useState({
    goals: [],
    profile: { name:'', city:'', education:'', gradYear:'', employed:'' },
    experiences: [{ ...BLANK_EXP }],
    selectedSkills: [], selectedTools: [], selectedAiTools: [],
    targetRoles: [], industries: [],
    preferences: { workTypes:[], locations:[], stipend:'', availability:'', hardNos:'' },
    links: { resumeText:'', portfolio:'', github:'', linkedin:'', otherDoc:'' },
    personalitySignal: '',
  });

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsParsing(true);
    const fd = new FormData();
    fd.append('resume', file);
    try {
      const res = await fetch(`${BACKEND_URL}/api/parse-resume`, { method:'POST', body:fd });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          profile: { ...prev.profile, ...data.profile },
          experiences: data.experiences?.length
            ? data.experiences.map(e => ({ ...BLANK_EXP, ...e, types:[], duration:{} }))
            : prev.experiences,
          selectedSkills: data.skills ? data.skills.split(',').map(s=>s.trim()).filter(Boolean) : prev.selectedSkills,
          selectedTools: data.tools ? data.tools.split(',').map(s=>s.trim()).filter(Boolean) : prev.selectedTools,
          links: { ...prev.links, resumeText: data.rawText || '' },
        }));
        setStep(1);
      } else { alert('Failed to parse. Try again or fill manually.'); }
    } catch { alert('Backend not reachable — make sure it is running on port 5000.'); }
    finally { setIsParsing(false); }
  };

  const handleNext = () => {
    if (step === 0) { setStep(1); return; }
    const errs = validateStep(step, formData);
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    if (step < 8) setStep(step + 1);
    else finish();
  };

  const finish = async () => {
    setIsSaving(true); setSaveError('');
    const err = await saveProfile(formData);
    setIsSaving(false);
    if (err) { setSaveError('Could not save. Please try again.'); return; }
    navigate('/dashboard');
  };

  const pct = step === 0 ? 0 : Math.round((step / 8) * 100);

  return (
    <div style={{ maxWidth:'780px', width:'100%', margin:'0 auto', padding:'2rem 1rem' }}>
      {step > 0 && (
        <div style={{ marginBottom:'1.5rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:'0.5rem' }}>
            <span style={{ fontWeight:600, color:'var(--text-primary)' }}>{TITLES[step]}</span>
            <span>Step {step} / 8 &nbsp;·&nbsp; {pct}%</span>
          </div>
          <div style={{ height:'4px', background:'rgba(255,255,255,0.08)', borderRadius:'9999px', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,var(--accent-primary),var(--accent-secondary))', transition:'width 0.35s ease' }} />
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding:'2.5rem' }}>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{opacity:0,x:24}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-24}} transition={{duration:0.2}}>

            {step === 0 && (
              <div style={{ textAlign:'center', padding:'1.5rem 0' }}>
                <h1 style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>Welcome to JobLens 👋</h1>
                <p className="mb-8" style={{ maxWidth:'460px', margin:'0 auto 2rem' }}>
                  Upload your resume and we'll auto-fill everything for you in seconds. Or fill manually — up to you!
                </p>
                <div style={{ background:'rgba(139,92,246,0.08)', border:'2px dashed rgba(139,92,246,0.4)', borderRadius:'12px', padding:'2.5rem', marginBottom:'1.5rem' }}>
                  <FileText size={48} color="var(--accent-secondary)" style={{ marginBottom:'1rem' }} />
                  <h3 className="mb-2">Upload Resume (PDF)</h3>
                  <p className="mb-6" style={{ fontSize:'0.9rem' }}>AI reads it and fills your name, education, skills & experience</p>
                  <input type="file" accept="application/pdf" id="resume-upload" style={{ display:'none' }} onChange={handleResumeUpload} />
                  <label htmlFor="resume-upload" className="btn btn-primary" style={{ cursor:'pointer', display:'inline-flex', padding:'0.75rem 2rem' }}>
                    {isParsing
                      ? <><Loader size={18} style={{animation:'spin 1s linear infinite'}}/> Parsing…</>
                      : <><UploadCloud size={18}/> Select PDF</>}
                  </label>
                </div>
                <button className="btn btn-secondary" onClick={() => setStep(1)}><SkipForward size={15}/> Fill Manually</button>
              </div>
            )}

            {step === 1 && <Step1Goals  formData={formData} setFormData={setFormData} errors={fieldErrors} />}
            {step === 2 && <Step2Profile formData={formData} setFormData={setFormData} errors={fieldErrors} />}
            {step === 3 && <Step3Clubs  formData={formData} setFormData={setFormData} errors={fieldErrors} />}
            {step === 4 && <Step4Skills  formData={formData} setFormData={setFormData} errors={fieldErrors} />}
            {step === 5 && <Step5Roles   formData={formData} setFormData={setFormData} errors={fieldErrors} />}
            {step === 6 && <Step6Prefs   formData={formData} setFormData={setFormData} errors={fieldErrors} />}

            {step === 7 && (
              <div style={{ maxHeight:'430px', overflowY:'auto', paddingRight:'6px' }}>
                <h3 className="mb-2" style={{ color:'var(--accent-secondary)' }}>Proof of Work *</h3>
                <p className="mb-5" style={{ fontSize:'0.9rem' }}>Resume text is used in every AI draft — required. Links are optional but help.</p>
                <div className="input-group">
                  <label className="input-label">Paste Resume Text *</label>
                  {fieldErrors['links.resumeText'] && <p style={{color:'var(--danger)',fontSize:'0.82rem',marginBottom:'0.3rem'}}>⚠️ {fieldErrors['links.resumeText']}</p>}
                  <textarea className="input-field" style={{ minHeight:'110px', borderColor: fieldErrors['links.resumeText'] ? 'var(--danger)' : '' }}
                    placeholder="Copy-paste the text from your PDF resume here…"
                    value={formData.links?.resumeText||''}
                    onChange={e=>setFormData({...formData,links:{...formData.links,resumeText:e.target.value}})} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                  {[['Portfolio / Website','portfolio','https://yoursite.com'],['GitHub','github','https://github.com/'],['LinkedIn URL','linkedin','https://linkedin.com/in/'],['Notion / Case Study','otherDoc','https://notion.so/']].map(([lbl,key,ph]) => (
                    <div className="input-group" key={key}>
                      <label className="input-label">{lbl}</label>
                      <input className="input-field" placeholder={ph} value={formData.links?.[key]||''}
                        onChange={e=>setFormData({...formData,links:{...formData.links,[key]:e.target.value}})} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 8 && (
              <div>
                <h3 className="mb-2" style={{ color:'var(--accent-secondary)' }}>Your Personality Signal 🌟 *</h3>
                <p className="mb-2" style={{ fontSize:'0.9rem' }}>The one thing you're most proud of — context, what you did, result.</p>
                <p className="mb-5" style={{ fontSize:'0.82rem', color:'var(--accent-primary)' }}>This gets used in every cold email & cover letter — it's what makes you sound human, not generic.</p>
                {fieldErrors.personalitySignal && <p style={{color:'var(--danger)',fontSize:'0.82rem',marginBottom:'0.5rem'}}>⚠️ {fieldErrors.personalitySignal}</p>}
                <textarea className="input-field"
                  style={{ minHeight:'200px', fontSize:'1.05rem', lineHeight:1.65, borderColor: fieldErrors.personalitySignal ? 'var(--danger)' : '' }}
                  placeholder="E.g. In my 3rd year I noticed students struggling to find notes. I built a Next.js platform in 48 hrs, hit 500 users in week 1, and scaled to 2,000 active users…"
                  value={formData.personalitySignal||''}
                  onChange={e=>setFormData({...formData,personalitySignal:e.target.value})} />
                {formData.personalitySignal && formData.personalitySignal.length < 50 && (
                  <p style={{color:'var(--warning)',fontSize:'0.82rem',marginTop:'0.4rem'}}>
                    {50 - formData.personalitySignal.length} more characters needed
                  </p>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        <div style={{ marginTop:'2rem', paddingTop:'1.25rem', borderTop:'1px solid var(--border-color)' }}>
          {Object.keys(fieldErrors).length > 0 && (
            <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'8px', padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.85rem', color:'var(--danger)' }}>
              ⚠️ Some fields are highlighted above — please fill them before continuing.
            </div>
          )}
          {saveError && <p style={{ color:'var(--danger)', fontSize:'0.85rem', marginBottom:'0.75rem', textAlign:'center' }}>⚠️ {saveError}</p>}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            {step > 0
              ? <button className="btn btn-secondary" onClick={()=>{setFieldErrors({}); setStep(step-1);}} disabled={isSaving}><ChevronLeft size={18}/> Back</button>
              : <div/>
            }
            {step > 0 && (
              <button className="btn btn-primary" onClick={handleNext} disabled={isSaving}>
                {step === 8
                  ? (isSaving ? <><Loader size={16} style={{animation:'spin 1s linear infinite'}}/> Saving…</> : <><CheckCircle size={18}/> Finish Profile</>)
                  : <>Continue <ArrowRight size={18}/></>
                }
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
