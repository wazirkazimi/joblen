const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Groq = require('groq-sdk');
const multer = require('multer');
const pdfParse = require('pdf-parse');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const upload = multer({ storage: multer.memoryStorage() });

// ─── RESUME PARSER ───────────────────────────────────────────────────────────
app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;

    const prompt = `You are an expert resume parser. Extract the candidate's details from the resume text below.

RESUME TEXT:
${resumeText}

Return ONLY a JSON object matching this exact schema — no extra text:
{
  "profile": {
    "name": "Full name",
    "city": "Current city or location",
    "education": "Highest degree and university name",
    "gradYear": "Graduation year (e.g. 2026)"
  },
  "experiences": [
    {
      "company": "Organization, Club, or Project Name",
      "role": "Role or Position Title",
      "duration": "e.g. Jan 2022 – Present",
      "metric": "ONE specific metric or outcome. If none found, extract the most impressive responsibility instead.",
      "types": ["Categorize into one or more of: Growth/Marketing, Product, Tech/Dev, Content, Operations, Design, Research, Community, Sales, Finance"]
    }
  ],
  "skills": "Comma-separated list of hard/technical skills",
  "tools": "Comma-separated list of tools and software"
}
Extract up to 5 most recent or relevant experiences. Include internships, clubs, freelance, and open-source.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an API returning only valid JSON. No markdown, no prose.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const data = JSON.parse(raw.replace(/```json|```/g, '').trim());
    res.json({ ...data, rawText: resumeText });
  } catch (err) {
    console.error('Resume parse error:', err);
    res.status(500).json({ error: 'Failed to parse resume.', details: err.message });
  }
});

// ─── JD ANALYZER ─────────────────────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  try {
    const { jobDescription, userProfile: u } = req.body;
    if (!jobDescription || !u) return res.status(400).json({ error: 'Job description and user profile are required.' });

    const p  = u.profile      || {};
    const pr = u.preferences  || {};
    const exps = (u.experiences || []).map(e =>
      `• ${e.role} @ ${e.company} (${e.duration?.computed || e.duration || 'unknown duration'}) — ${e.metric || 'no metric'} [${(e.types||[]).join(', ')}]`
    ).join('\n');

    const prompt = `You are an expert career advisor, talent analyst, and recruiter with 15+ years of experience.

Analyze how well this candidate fits the job description below. Be brutally honest but kind. Use their ACTUAL profile data — not generic advice.

══════════════════════════════════════════
CANDIDATE PROFILE
══════════════════════════════════════════
Name: ${p.name || 'Unknown'}
Location: ${p.city || 'Unknown'}
Education: ${p.education || 'Not provided'} | Graduating: ${p.gradYear || 'Unknown'}
Employment Status: ${p.employed || 'Unknown'}

Goals: ${(u.goals || []).join(', ') || 'Not specified'}

Experience & Contributions:
${exps || 'None provided'}

Hard Skills: ${(u.selectedSkills || []).join(', ') || 'Not provided'}
Soft Skills: ${(u.softSkills || []).join(', ') || 'Not provided'}
Daily Tools: ${(u.selectedTools || []).join(', ') || 'Not provided'}
AI Tools: ${(u.selectedAiTools || []).join(', ') || 'Not provided'}

Target Roles: ${(u.targetRoles || []).join(', ') || 'Not provided'}
Target Industries: ${(u.industries || []).join(', ') || 'Not provided'}

Work Type Preference: ${(pr.workTypes || []).join(', ') || 'Not specified'}
Preferred Locations: ${(pr.locations || []).join(', ') || 'Not specified'}
Min Salary / Stipend: ${pr.stipend || 'Not specified'}
Availability: ${pr.availability || 'Not specified'}
Hard No's: ${pr.hardNos || 'None stated'}

Personality Signal (their proudest achievement):
"${u.personalitySignal || 'Not provided'}"

Resume Text Snippet:
${(u.links?.resumeText || '').slice(0, 1500)}

══════════════════════════════════════════
JOB DESCRIPTION
══════════════════════════════════════════
${jobDescription}

══════════════════════════════════════════
INSTRUCTIONS
══════════════════════════════════════════
1. Read the JD carefully. Extract: role, company, salary/stipend mentioned, work mode (remote/hybrid/onsite), location, required skills, culture signals.
2. Compare EACH against the candidate's profile. Be specific — name actual matching and mismatching skills.
3. Check preference alignment: Does the JD's salary match their minimum? Does location match? Does work type match? Does culture match their Hard No's?
4. Give a fitScore from 1–10 based on real skill+preference overlap. Do NOT inflate scores.
5. Write drafts using their actual name, metrics, and personality signal — not placeholders.

Return ONLY this JSON (no markdown, no extra text):
{
  "company": "Company name extracted from JD",
  "role": "Exact role title from JD",
  "fitScore": <1-10 integer>,
  "probability": "High" | "Medium" | "Stretch",
  "fitReason": "2-3 sentences. Speak directly to candidate. Mention specific skills that match. Be honest about gaps. Use their name. Add 1-2 emojis naturally.",
  "isSpam": <boolean — true if JD is vague, unpaid, or suspicious>,
  "spamReason": "Brief spam verdict",
  "pros": [
    "Specific strength that matches (name the skill/experience)",
    "Another match",
    "A third strength"
  ],
  "flags": [
    "Specific gap or mismatch",
    "Another concern"
  ],
  "preferenceCheck": {
    "salary": {
      "jdOffers": "What the JD says about pay (or 'Not mentioned')",
      "candidateExpects": "${pr.stipend || 'Not specified'}",
      "match": "Yes | No | Unclear",
      "note": "Short comment on salary alignment"
    },
    "location": {
      "jdLocation": "Location/remote policy from JD",
      "candidatePrefers": "${(pr.locations || []).join(', ') || 'Not specified'}",
      "match": "Yes | No | Unclear",
      "note": "Short comment"
    },
    "workType": {
      "jdType": "Full-time/Part-time/Internship/Contract from JD",
      "candidatePrefers": "${(pr.workTypes || []).join(', ') || 'Not specified'}",
      "match": "Yes | No | Unclear",
      "note": "Short comment"
    },
    "culture": {
      "jdCultureSignals": "Key culture signals from JD (pace, team size, autonomy, etc.)",
      "candidateHardNos": "${pr.hardNos || 'None stated'}",
      "redFlag": <boolean — true if JD culture clashes with Hard No's>,
      "note": "Specific clash or alignment explanation"
    }
  },
  "skillsGapAnalysis": {
    "strongMatches": ["Skills the candidate HAS that the JD explicitly needs"],
    "partialMatches": ["Skills candidate has adjacent experience in"],
    "missingSkills": ["Skills JD requires that candidate clearly lacks"],
    "bonusSkills": ["Candidate skills that aren't required but would impress"]
  },
  "emailDraft": "Personalized cold email using candidate's name '${p.name || 'the candidate'}', their top metric, and personality signal. 150-200 words. Subject line on first line starting with 'Subject:'",
  "dmDraft": "Punchy 3-4 line LinkedIn DM to the hiring manager. Uses a specific detail from the JD.",
  "applicationQA": [
    {
      "question": "If JD has screening questions or implies them, list each one",
      "answer": "Personalized answer using their background and personality signal"
    }
  ]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an API returning only valid JSON. Be specific, accurate, and honest. Never use placeholder names or generic advice.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.4, // lower = more accurate, less hallucination
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const data = JSON.parse(raw.replace(/```json|```/g, '').trim());
    res.json(data);
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'Failed to analyze.', details: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
