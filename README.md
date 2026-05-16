# JobLens 🔍

> **AI-powered job fit analyzer for freshers and early-career professionals.**
> Paste any job description → get a personalized fit score, skills gap breakdown, salary check, culture match, dream company detection, and a cold email that actually sounds like you — in under 4 seconds.

**Live:** [joblen.vercel.app](https://joblen.vercel.app) · **Backend:** [joblen.onrender.com](https://joblen.onrender.com)

---

## ✨ Features

### 🎯 Core Analysis Engine
- **Fit Score (1–10)** — honest, non-inflated score based on real skill + preference overlap
- **Probability** — High / Medium / Stretch classification
- **Skills Gap Analysis** — colour-coded: Strong Match, Partial Match, Missing, Bonus Skills
- **Preference Check** — salary, location, work type, and culture vs. your hard no's
- **Spam Detector** — flags vague JDs, unpaid roles, and unrealistic requirements
- **Dream Company Match** — ⭐ banner when the JD company matches your target companies list
- **Application Q&A** — auto-generated answers to likely screening questions

### ✉️ 1-Click Drafts
- **Cold Email** — personalized using your name, top metric, and personality signal (150–200 words with subject line)
- **LinkedIn DM** — punchy 3–4 line message using a specific JD detail

### 🧠 Personalization & Feedback Loop
- **User Feedback Widget** — after every analysis: 👍 Yes I'd apply / 👎 Not this one
- **Quick-pick reason chips** — no free-text typing, just tap what resonated
- **Feedback saved to DB** — future analyses factor in your pattern (e.g., if you keep skipping low-salary roles)
- **Profile completeness meter** — tracks what's missing and prompts you to fill it in

### 🔐 Authentication
- Email/password sign up & log in via Supabase Auth
- **Forgot Password** flow — "Send Reset Link" → email → one-click reset
- Persistent sessions across page reloads

### 📜 Analysis History
- All analyses auto-saved to Supabase
- Expandable cards with fit reason, pros/flags, and email draft preview
- Feedback badge (👍 / 👎) shown per entry
- Delete individual entries
- Mobile-optimised: 2-line role clamp, wrapping meta row, compact score circle

### 🎨 UI / UX
- Premium dark glassmorphism design with gradient accents
- Fully **mobile responsive** on all screen sizes
- Slide-in sidebar drawer with hamburger (top-right) on mobile
- **Logo analyzing animation** — pulsing logo + expanding rings + shimmer progress bar while AI processes
- Smooth Framer Motion transitions on page load, result reveal, and section expansion
- Sticky navbar on landing page
- **Vercel Analytics** — page view tracking built in

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite |
| **Styling** | Vanilla CSS (glassmorphism, custom design system) |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Auth + DB** | Supabase (Auth + PostgreSQL + RLS) |
| **AI / LLM** | Groq API — `llama-3.1-8b-instant` |
| **Backend** | Node.js + Express |
| **Resume Parse** | `pdf-parse@1.1.1` |
| **Analytics** | Vercel Analytics |
| **Frontend Deploy** | Vercel |
| **Backend Deploy** | Render |

---

## 📁 Project Structure

```
joblen/
├── public/
│   ├── favicon.png          # White-circle logo (visible on all browser tabs)
│   ├── logo.png             # Dark branded logo (app branding)
│   └── logo-light.png       # Light logo (favicon, Apple touch icon)
│
├── backend/
│   ├── server.js            # Express API (analyze + resume parse)
│   ├── package.json
│   └── .env                 # GROQ_API_KEY, PORT (never committed)
│
├── src/
│   ├── components/
│   │   ├── Logo.jsx          # Reusable logo component (variant: dark | light)
│   │   ├── Sidebar.jsx       # Nav sidebar with mobile hamburger drawer
│   │   ├── EditCard.jsx      # Collapsible edit card for profile sections
│   │   ├── MultiSelect.jsx   # Chip-select multi-option component
│   │   ├── SearchableDropdown.jsx
│   │   └── DurationPicker.jsx
│   │
│   ├── context/
│   │   └── AuthContext.jsx   # Auth state, profile save (onConflict upsert + re-fetch)
│   │
│   ├── lib/
│   │   ├── supabase.js       # Supabase client (env-vars only, no hardcoded fallbacks)
│   │   └── config.js         # BACKEND_URL centralised
│   │
│   ├── pages/
│   │   ├── Landing.jsx       # Marketing page: hero, how-it-works, features, CTA
│   │   ├── AuthPage.jsx      # Login / Signup / Forgot Password (3-mode)
│   │   ├── Onboarding.jsx    # 6-step onboarding wizard with resume upload
│   │   ├── Home.jsx          # Dashboard: JD input, analysis results, feedback widget
│   │   ├── Profile.jsx       # Edit profile cards (2-col → 1-col on mobile)
│   │   └── History.jsx       # Saved analyses from Supabase (mobile-optimised)
│   │
│   ├── App.jsx               # Routes + sidebar layout logic
│   ├── main.jsx              # Entry point + Vercel Analytics
│   └── index.css             # Global design system + full responsive CSS
│
├── supabase_analyses.sql     # Run in Supabase SQL Editor (analyses + feedback columns)
├── vercel.json               # SPA routing: all paths → index.html
├── index.html                # Favicon, SEO meta, OG + Twitter card tags
├── .env                      # Frontend env vars (never committed)
└── package.json
```

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key

### 1. Clone the repo

```bash
git clone https://github.com/wazirkazimi/joblen.git
cd joblen
```

### 2. Frontend environment variables

Create `.env` in the root `/joblen` folder:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=http://localhost:5000
```

> ⚠️ Get these from **Supabase → Settings → API**. The URL and key must match the **same project**.

### 3. Backend environment variables

Create `.env` inside `/joblen/backend`:

```env
GROQ_API_KEY=your_groq_api_key
PORT=5000
```

### 4. Install dependencies

```bash
# Frontend
npm install

# Backend
cd backend && npm install && cd ..
```

### 5. Set up Supabase tables

Run the following in **Supabase → SQL Editor**:

#### `profiles` table

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

#### `analyses` table (copy from `supabase_analyses.sql`)

```sql
create table if not exists public.analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  job_description text,
  result jsonb not null,
  feedback_decision text,      -- 'yes' | 'no'
  feedback_reasons  text[],    -- array of reason strings
  created_at timestamptz default now()
);

alter table public.analyses enable row level security;

create policy "Users can read own analyses"
  on public.analyses for select using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.analyses for insert with check (auth.uid() = user_id);

create policy "Users can update own analyses"
  on public.analyses for update using (auth.uid() = user_id);

create policy "Users can delete own analyses"
  on public.analyses for delete using (auth.uid() = user_id);
```

> If the `analyses` table already exists without the feedback columns, run:
> ```sql
> alter table public.analyses add column if not exists feedback_decision text;
> alter table public.analyses add column if not exists feedback_reasons text[];
> create policy "Users can update own analyses" on public.analyses for update using (auth.uid() = user_id);
> ```

#### Auth settings
Supabase → **Authentication → Email** → turn off **"Confirm email"** (for dev)

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

## ☁️ Production Deployment

### Backend → Render

1. [render.com](https://render.com) → New → **Web Service** → connect GitHub repo
2. **Root Directory**: `backend`
3. **Start Command**: `node server.js`
4. **Environment Variables**:
   ```
   GROQ_API_KEY=your_groq_key
   PORT=5000
   ```
5. Copy your Render URL (e.g. `https://joblen.onrender.com`)

> ⚠️ Free tier goes to sleep after 15 min inactivity. First request after sleep takes ~15–30s (cold start). Upgrade to Starter ($7/mo) to eliminate this.

### Frontend → Vercel

1. [vercel.com](https://vercel.com) → New Project → Import GitHub repo
2. **Framework Preset**: `Vite`
3. **Root Directory**: `./`
4. **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `VITE_BACKEND_URL` | `https://joblen.onrender.com` |

5. Click **Deploy**

### Post-Deployment Checklist

- [ ] Supabase → **Auth → URL Configuration → Redirect URLs** → add `https://joblen.vercel.app/**`
- [ ] Run both SQL scripts in Supabase SQL Editor
- [ ] Verify Vercel env vars match the **exact same Supabase project** (URL and anon key must have matching project IDs)
- [ ] Test: sign up → onboarding → paste a JD → analyze → check history

---

## 🔌 API Reference

### `POST /api/parse-resume`

Parses a PDF resume and extracts structured profile data.

**Request:** `multipart/form-data` — field: `resume` (PDF)

**Response:**
```json
{
  "profile":     { "name": "...", "city": "...", "education": "...", "gradYear": "..." },
  "experiences": [{ "company": "...", "role": "...", "duration": "...", "metric": "..." }],
  "skills":      "React, Python, ...",
  "tools":       "Notion, Figma, ...",
  "rawText":     "full resume text..."
}
```

---

### `POST /api/analyze`

Analyzes a job description against the user's profile using Groq LLM.

**Request:**
```json
{
  "jobDescription": "Full JD text...",
  "userProfile":    { "...full profile object..." }
}
```

**Response:**
```json
{
  "company":      "Acme Corp",
  "role":         "Product Manager Intern",
  "fitScore":     7,
  "probability":  "High",
  "fitReason":    "2–3 sentences personalized to candidate...",
  "isSpam":       false,
  "spamReason":   "...",
  "pros":         ["Skill match...", "..."],
  "flags":        ["Gap in X...", "..."],
  "companyMatch": {
    "isDreamCompany": true,
    "note": "Stripe is on your target list — dream company match! 🎯"
  },
  "preferenceCheck": {
    "salary":   { "jdOffers": "...", "candidateExpects": "...", "match": "Yes", "note": "..." },
    "location": { "jdLocation": "...", "candidatePrefers": "...", "match": "Yes", "note": "..." },
    "workType": { "jdType": "...", "candidatePrefers": "...", "match": "Yes", "note": "..." },
    "culture":  { "jdCultureSignals": "...", "candidateHardNos": "...", "redFlag": false, "note": "..." }
  },
  "skillsGapAnalysis": {
    "strongMatches":  ["..."],
    "partialMatches": ["..."],
    "missingSkills":  ["..."],
    "bonusSkills":    ["..."]
  },
  "emailDraft":     "Subject: ...\n\nDear hiring manager...",
  "dmDraft":        "Hey [Name], saw your post about...",
  "applicationQA":  [{ "question": "...", "answer": "..." }]
}
```

---

## 🔑 Environment Variables

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL (from Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key (must match same project) |
| `VITE_BACKEND_URL` | Backend URL (`http://localhost:5000` locally, Render URL in prod) |

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Groq API key from [console.groq.com](https://console.groq.com) |
| `PORT` | Server port (default: `5000`) |

---

## 📱 Mobile Responsiveness

| Page | Mobile behaviour |
|---|---|
| **Landing** | Sticky nav, hero scales, 4-col grid → 2-col → 1-col |
| **Auth** | Full-width card, logo centred |
| **Dashboard** | Hamburger ☰ (top-right) opens slide-in sidebar drawer |
| **Home (Analyzer)** | Score header stacks, pros/flags → 1-col, feedback chips wrap |
| **Profile** | 2-col card grid → 1-col |
| **History** | Cards 700px max, role wraps 2 lines, meta row wraps gracefully |

---

## 🎨 Logo Usage

Two logo variants in `/public`:

| File | Used for |
|---|---|
| `logo.png` | App branding — sidebar, auth page, landing navbar (dark background) |
| `logo-light.png` / `favicon.png` | Browser tab favicon, Apple touch icon (white circle, visible on all backgrounds) |

Use the `<Logo>` component anywhere:
```jsx
import Logo from '../components/Logo';

<Logo size={36} />                    // dark variant, with wordmark
<Logo size={56} variant="light" />    // light variant
<Logo size={24} showText={false} />   // icon only
```

---

## ⚡ Performance

| Optimization | Detail |
|---|---|
| **LLM Model** | `llama-3.1-8b-instant` — 800+ tok/sec on Groq (~4s total) |
| **max_tokens: 2500** | Caps output, prevents runaway generation |
| **Supabase upsert** | `onConflict: 'user_id'` — safe re-saves without duplicates |
| **Re-fetch after save** | Profile changes reflect immediately after save |
| **AnimatePresence** | Smooth unmount animations prevent jarring layout shifts |

---

## 🗺️ Key Design Decisions

| Decision | Reason |
|---|---|
| `llama-3.1-8b-instant` over 70B | 10× faster, equal quality for structured JSON tasks |
| Env-vars only in `supabase.js` | Prevents silent failures from hardcoded wrong project IDs |
| `onConflict: 'user_id'` upsert | Idempotent profile saves — no duplicates ever |
| Re-fetch profile after save | Guarantees UI reflects actual DB state, not optimistic cache |
| Feedback chip-select not free-text | Zero friction — users tap reasons, don't type essays |
| CORS regex for `*.vercel.app` | Covers all preview branches without manual backend updates |
| `vercel.json` rewrites | React Router needs all paths to serve `index.html` |
| `pdf-parse@1.1.1` not v2 | v2 breaks CommonJS import; v1.1.1 is stable |
| Sidebar as fixed drawer on mobile | Native app feel — overlay + swipe-close |
| White-circle logo for favicon | Readable on Chrome's light grey tab background |

---

## 🐛 Troubleshooting

| Issue | Fix |
|---|---|
| `ERR_NAME_NOT_RESOLVED` on login | Supabase URL in Vercel env vars doesn't match your project. Go to Supabase → Settings → API and copy the exact URL |
| `Failed to fetch` in production | Check `VITE_BACKEND_URL` in Vercel env vars points to your Render URL (not localhost) |
| Profile saves but doesn't reflect | Run the SQL `alter table` update policy migration; verify Supabase RLS policies |
| History shows "0 saved" | Run `supabase_analyses.sql` in Supabase SQL Editor first |
| Forgot password email not arriving | Add `https://yourdomain.vercel.app/**` to Supabase → Auth → URL Configuration → Redirect URLs |
| Cold start delay (~15–30s) | Render Free tier sleeps after 15 min. Upgrade to Starter ($7/mo) to eliminate |
| CORS error in production | Render backend `server.js` allows `*.vercel.app` by default. If using a custom domain, add it to the CORS origins array |
| White page on load | Check browser console for missing environment variables (`VITE_SUPABASE_URL` undefined) |
| `Failed to parse resume` | Ensure `pdf-parse` is exactly version `1.1.1` in `backend/package.json` |
| Port already in use | `taskkill /F /IM node.exe` (Windows) or `pkill node` (Mac/Linux) |

---

## 📄 License

MIT — built by [Wazir Kazimi](https://github.com/wazirkazimi)
