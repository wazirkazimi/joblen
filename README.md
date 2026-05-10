# 🔍 JobLens

> **AI-powered job description analyzer for students and early-career professionals.**  
> Paste any job description → get a personalized fit score, skills gap analysis, salary comparison, culture check, cold email draft, LinkedIn DM, and application Q&A — all in seconds.

---

## ✨ Features

### 🧠 AI Analysis Engine
- **Fit Score** (1–10) — honest, profile-specific scoring
- **Preference Match** — compares your salary, location, work type & culture against the JD
- **Skills Gap Analysis** — colour-coded: Strong Match / Partial / Missing / Bonus
- **Red Flags** — spots vague, unpaid, or spam job posts
- **Application Drafts** — personalized cold email, LinkedIn DM, and Q&A answers

### 🧭 8-Step Smart Onboarding
1. **Resume Upload** — AI parses PDF and auto-fills all fields
2. **Career Goals** — pick up to 2 (max)
3. **Basic Info** — name, city, education, graduation year
4. **Clubs & Contributions** — projects, internships, open-source with duration picker
5. **Skills & Tools** — searchable dropdowns for hard skills, soft skills, daily tools, AI tools
6. **Target Roles & Industries** — flat searchable list (works for technical & non-technical)
7. **Preferences** — work type, locations (all Indian states + global), stipend, availability, hard no's
8. **Proof of Work + Personality Signal** — resume text and your proudest achievement

### 👤 Profile Page
- Wellfound-style white/blue card layout
- **Inline editing** — click Edit on any card, change details, hit Save. No redirect to onboarding.
- **Completeness tracker** — shows exactly which fields are missing with a % progress bar

### 📜 History
- Every analysis is auto-saved to Supabase
- Expandable cards with score, email draft, pros/flags
- Delete individual analyses

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Framer Motion |
| Styling | Vanilla CSS (custom design system) |
| Auth & DB | Supabase (Auth + PostgreSQL + RLS) |
| AI | Groq SDK (`llama-3.3-70b-versatile`) |
| Resume Parse | `pdf-parse` v1.1.1 |
| Backend | Express.js (Node.js) |
| Icons | Lucide React |
| Routing | React Router v6 |

---

## 📁 Project Structure

```
joblen/
├── backend/
│   ├── server.js          # Express API (resume parse + JD analyze)
│   ├── package.json
│   └── .env               # GROQ_API_KEY
│
├── src/
│   ├── components/
│   │   ├── EditCard.jsx          # Reusable inline-edit card wrapper
│   │   ├── SearchableDropdown.jsx # Multi-select with custom value support
│   │   ├── MultiSelect.jsx        # ChipSelect + CategoryChips
│   │   ├── DurationPicker.jsx     # Month/Year start-end picker
│   │   └── Sidebar.jsx
│   │
│   ├── context/
│   │   └── AuthContext.jsx        # Supabase auth + profile state
│   │
│   ├── lib/
│   │   ├── supabase.js            # Supabase client
│   │   └── config.js              # BACKEND_URL (dev vs production)
│   │
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── AuthPage.jsx           # Login + Sign Up
│   │   ├── Onboarding.jsx         # 8-step wizard
│   │   ├── Home.jsx               # Dashboard + JD analyzer
│   │   ├── Profile.jsx            # Inline-edit profile page
│   │   ├── History.jsx            # Saved analyses from Supabase
│   │   └── onboarding/
│   │       ├── Step1Goals.jsx
│   │       ├── Step2Profile.jsx
│   │       ├── Step3Clubs.jsx
│   │       ├── Step4Skills.jsx
│   │       ├── Step5Roles.jsx
│   │       └── Step6Prefs.jsx
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── supabase_analyses.sql  # SQL to run in Supabase for history table
├── vercel.json            # SPA routing fix for Vercel
├── .env                   # Frontend env vars (Supabase keys)
├── .env.production        # Production env (with Railway URL)
└── package.json
```

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key

---

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/joblen.git
cd joblen
```

---

### 2. Frontend — environment variables

Create `.env` in the root `/joblen` folder:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=http://localhost:5000
```

---

### 3. Backend — environment variables

Create `.env` inside `/joblen/backend`:

```env
GROQ_API_KEY=your_groq_api_key
PORT=5000
```

---

### 4. Install dependencies

```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

---

### 5. Set up Supabase

#### a) Create the `profiles` table
Run this in **Supabase → SQL Editor**:

```sql
create table if not exists public.profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique not null,
  profile_data jsonb,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = user_id);

create policy "Users can upsert own profile"
  on public.profiles for insert with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = user_id);
```

#### b) Create the `analyses` table
Run the contents of `supabase_analyses.sql`:

```sql
create table if not exists public.analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  job_description text,
  result jsonb not null,
  created_at timestamptz default now()
);

alter table public.analyses enable row level security;

create policy "Users can read own analyses"
  on public.analyses for select using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.analyses for insert with check (auth.uid() = user_id);

create policy "Users can delete own analyses"
  on public.analyses for delete using (auth.uid() = user_id);
```

#### c) Disable email confirmation (for dev)
Supabase → **Authentication → Email** → turn off **"Confirm email"**

---

### 6. Run locally

```bash
# Terminal 1 — Backend
cd backend
node server.js
# ✅ Server running on http://localhost:5000

# Terminal 2 — Frontend
cd ..
npm run dev
# ✅ http://localhost:5173
```

---

## 🚀 Deployment

### Backend → Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Set **Root Directory**: `backend`
3. Add environment variables:
   ```
   GROQ_API_KEY=your_groq_key
   PORT=5000
   ```
4. Copy the generated Railway URL (e.g. `https://joblen-backend.up.railway.app`)

---

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import GitHub repo
2. **Framework Preset**: `Vite`
3. **Root Directory**: `./`
4. Add environment variables:

   | Key | Value |
   |-----|-------|
   | `VITE_SUPABASE_URL` | Your Supabase URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `VITE_BACKEND_URL` | Your Railway backend URL |

5. Click **Deploy**

---

### Post-Deployment Checklist

- [ ] Update `backend/server.js` CORS origin with your Vercel domain
- [ ] Supabase → **Auth → URL Configuration** → add your Vercel domain to Redirect URLs
- [ ] Run both SQL scripts in Supabase SQL Editor
- [ ] Test sign up, onboarding, and JD analysis end-to-end

---

## 🔌 API Reference

### `POST /api/parse-resume`
Parses a PDF resume and extracts structured profile data.

**Request:** `multipart/form-data` with field `resume` (PDF file)

**Response:**
```json
{
  "profile": { "name": "...", "city": "...", "education": "...", "gradYear": "..." },
  "experiences": [{ "company": "...", "role": "...", "duration": "...", "metric": "...", "types": [] }],
  "skills": "React, Python, ...",
  "tools": "Notion, Figma, ...",
  "rawText": "full resume text..."
}
```

---

### `POST /api/analyze`
Analyzes a job description against the user's profile.

**Request:**
```json
{
  "jobDescription": "Full JD text...",
  "userProfile": { ...full profile object... }
}
```

**Response:**
```json
{
  "company": "Acme Corp",
  "role": "Product Manager Intern",
  "fitScore": 7,
  "probability": "High",
  "fitReason": "...",
  "isSpam": false,
  "pros": ["..."],
  "flags": ["..."],
  "preferenceCheck": {
    "salary": { "jdOffers": "...", "candidateExpects": "...", "match": "Yes", "note": "..." },
    "location": { ... },
    "workType": { ... },
    "culture": { "jdCultureSignals": "...", "candidateHardNos": "...", "redFlag": false, "note": "..." }
  },
  "skillsGapAnalysis": {
    "strongMatches": ["..."],
    "partialMatches": ["..."],
    "missingSkills": ["..."],
    "bonusSkills": ["..."]
  },
  "emailDraft": "Subject: ...\n\n...",
  "dmDraft": "...",
  "applicationQA": [{ "question": "...", "answer": "..." }]
}
```

---

## 🗝 Environment Variables Reference

### Frontend (`.env`)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `VITE_BACKEND_URL` | Backend server URL (`http://localhost:5000` in dev) |

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq API key for LLM inference |
| `PORT` | Server port (default: 5000) |

---

## 🧩 Key Design Decisions

| Decision | Reason |
|----------|--------|
| Groq `llama-3.3-70b-versatile` | Fast, free tier, excellent instruction following |
| `temperature: 0.4` for analysis | Reduces hallucination, more factual scoring |
| `pdf-parse@1.1.1` (not v2) | v2 breaks CommonJS import; v1.1.1 is stable |
| Supabase RLS on all tables | Users can only read/write their own data |
| `profileChecked` flag in AuthContext | Prevents redirect loop when Supabase table doesn't exist yet |
| Flat searchable dropdowns | Non-technical users can't navigate categorized skill trees |
| `vercel.json` rewrites | React Router needs all paths to serve `index.html` |

---

## 🐛 Known Issues & Troubleshooting

| Issue | Fix |
|-------|-----|
| White page on load | Check browser console for missing lucide-react exports |
| `Failed to parse resume` | Make sure `pdf-parse` is version `1.1.1` exactly |
| Email rate limit (Supabase) | Disable "Confirm email" in Supabase Auth settings |
| CORS error in production | Add your Vercel domain to `backend/server.js` CORS array |
| Profile not saving | Run both SQL scripts in Supabase SQL Editor |
| Port already in use | Kill old dev server: `taskkill /F /IM node.exe` (Windows) |

---

## 📄 License

MIT — built by [Wazir Kazimi](https://github.com/wazirkazimi)
