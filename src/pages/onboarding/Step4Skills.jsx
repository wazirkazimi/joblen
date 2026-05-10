import React from 'react';
import SearchableDropdown from '../../components/SearchableDropdown';

const HARD_SKILLS = [
  // Frontend
  'HTML','CSS','JavaScript','TypeScript','React','Next.js','Vue.js','Angular','Tailwind CSS','Bootstrap','WordPress','Webflow',
  // Backend
  'Node.js','Python','Java','Go','PHP','Ruby','C++','C#','Express.js','FastAPI','Django','Spring Boot','NestJS',
  // Mobile
  'React Native','Flutter','Swift','Kotlin','Dart','Ionic',
  // Data & DB
  'SQL','PostgreSQL','MySQL','MongoDB','Redis','Firebase','Supabase','GraphQL','REST APIs','Prisma',
  // Cloud & DevOps
  'AWS','Google Cloud','Azure','Docker','Kubernetes','CI/CD','Terraform','Linux','Bash/Shell',
  // Design
  'Figma','Adobe XD','Illustrator','Photoshop','Sketch','Principle','Framer','After Effects',
  // Marketing / Growth
  'SEO','SEM','Google Analytics','Meta Ads','Google Ads','Email Marketing','Copywriting','A/B Testing','Content Marketing','HubSpot','Salesforce',
  // Business / Ops
  'Excel','PowerPoint','Financial Modelling','Market Research','Project Management','Business Analysis','Data Analysis','Pitch Decks','OKRs',
  // Non-tech general
  'Public Speaking','Research','Writing','Video Editing','Photography','Community Building','Event Management','Recruiting','Social Media Management',
];

const SOFT_SKILLS = [
  'Leadership','Communication','Problem Solving','Critical Thinking','Teamwork','Adaptability',
  'Time Management','Creativity','Emotional Intelligence','Conflict Resolution','Decision Making',
  'Networking','Attention to Detail','Self-Motivation','Growth Mindset','Ownership & Accountability',
  'Stakeholder Management','Presentation Skills','Mentoring','Strategic Thinking',
];

const TOOL_CATS_FLAT = [
  // Productivity
  'Notion','Airtable','Trello','Jira','Linear','Asana','ClickUp','Monday.com',
  // Data
  'Google Sheets','Excel','Tableau','Power BI','Metabase','Looker','Google Data Studio',
  // Dev tools
  'VS Code','GitHub','GitLab','Postman','Vercel','Railway','Netlify','Cursor','Replit',
  // Automation
  'n8n','Zapier','Make (Integromat)','Bubble','Webflow','Glide','AppScript',
  // Communication
  'Slack','Discord','Zoom','Loom','Teams','Confluence',
  // Design tools
  'Canva','Figma','Miro','Whimsical',
  // CRM / Sales
  'HubSpot','Salesforce','Pipedrive','Notion CRM',
];

const AI_TOOLS = [
  'ChatGPT','Claude','Gemini','Perplexity','Mistral','Llama','Grok','DeepSeek',
  'GitHub Copilot','Cursor AI','Codeium','Tabnine','Amazon CodeWhisperer',
  'Midjourney','DALL·E','Adobe Firefly','Stable Diffusion','Runway','Suno','ElevenLabs',
  'Notion AI','Gamma','Beautiful.ai','Otter.ai','Whisper','HeyGen',
  'LangChain','LlamaIndex','HuggingFace','Replicate','Pinecone','Weaviate',
  'AutoGPT','CrewAI','Dify','Flowise',
];

const Section = ({ title, emoji, children }) => (
  <section style={{ marginBottom:'2rem' }}>
    <div style={{ fontSize:'1rem', fontWeight:600, marginBottom:'0.4rem', paddingBottom:'0.5rem', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
      {emoji} {title}
    </div>
    {children}
  </section>
);

export default function Step4Skills({ formData, setFormData, errors = {} }) {
  const set = (key, val) => setFormData({ ...formData, [key]: val });

  return (
    <div style={{ maxHeight:'470px', overflowY:'auto', paddingRight:'6px' }}>
      <h3 className="mb-2" style={{ color:'var(--accent-secondary)' }}>Skills & Tools *</h3>
      <p className="mb-5" style={{ fontSize:'0.9rem' }}>Search from the list or type to add your own. Be honest — recruiters verify!</p>

      <Section emoji="💡" title="Hard Skills">
        {errors.selectedSkills && <p style={{color:'var(--danger)',fontSize:'0.82rem',marginBottom:'0.4rem'}}>⚠️ {errors.selectedSkills}</p>}
        <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:'0.6rem' }}>Technical & domain-specific skills — search from the list or type a custom one</p>
        <SearchableDropdown
          options={HARD_SKILLS}
          selected={formData.selectedSkills || []}
          onChange={val => set('selectedSkills', val)}
          placeholder="Search skills (React, Python, Excel, SEO…)"
        />
      </Section>

      <Section emoji="🧠" title="Soft Skills">
        <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:'0.6rem' }}>Interpersonal & professional traits</p>
        <SearchableDropdown
          options={SOFT_SKILLS}
          selected={formData.softSkills || []}
          onChange={val => set('softSkills', val)}
          placeholder="Search soft skills (Leadership, Communication…)"
        />
      </Section>

      <Section emoji="🛠" title="Tools Used Daily">
        <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:'0.6rem' }}>Apps & platforms you use for your work</p>
        <SearchableDropdown
          options={TOOL_CATS_FLAT}
          selected={formData.selectedTools || []}
          onChange={val => set('selectedTools', val)}
          placeholder="Search tools (Notion, GitHub, Figma…)"
        />
      </Section>

      <Section emoji="🤖" title="AI Tools & Languages You Use">
        <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:'0.6rem' }}>Works for both technical and non-technical users</p>
        <SearchableDropdown
          options={AI_TOOLS}
          selected={formData.selectedAiTools || []}
          onChange={val => set('selectedAiTools', val)}
          placeholder="Search AI tools (ChatGPT, Claude, Copilot…)"
        />
      </Section>
    </div>
  );
}
