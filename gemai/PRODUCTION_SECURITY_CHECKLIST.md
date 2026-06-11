# AuraLux AI - Production Security & Safety Checklist

This checklist tracks critical safety mechanisms implemented to protect AuraLux AI API keys, budgets, databases, and general infrastructure from abuse or leakage in production environments.

## 1. API Key Safety
- [ ] **Secrets Externalization**: Ensure `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_API_SECRET`, and `ADMIN_SECRET` are **never** committed to version control. They must only live in encrypted env files or production platform dashboard environment variables.
- [ ] **Restrict Key Scopes**:
  - The Supabase client on the client-side should use the public `anon` key, which has row-level security (RLS) enabled.
  - The `service_role` key must **never** be exposed to the client application under any circumstances.
- [ ] **Proxy Calls**: All calls to OpenAI or high-cost services are wrapped via Express controllers (`backend/index.js`). The frontend has no direct access to OpenAI endpoints or keys.

## 2. Cost & Budget Safety
- [ ] **Rate Limiting**:
  - `/api/generate` is rate-limited using `express-rate-limit` to a maximum of 5 requests per IP per hour.
  - `/api/admin/login` is rate-limited to 5 requests per 15 minutes to prevent brute-forcing.
- [ ] **Visitor Limits (3 Free Generations)**:
  - Generates a unique, persistent client-side `visitor_id` and saves it in cookies + `localStorage`.
  - Backend verifies usage statistics against the Supabase `generations` logs before allowing standard users to queue generations.
- [ ] **IP Hard Caps**:
  - Max 5 successful generations per IP address per day (`HARD_MAX_PER_IP_PER_DAY=5`).
- [ ] **Global Volume Caps**:
  - Global budget cap of max 80 total successful generations (`HARD_MAX_TOTAL_GENERATIONS=80`).
  - Global daily cap of max 20 generations (`HARD_MAX_DAILY_GENERATIONS=20`).
  - Strict estimated budget limit of $5 USD (`MVP_BUDGET_USD=5`).
- [ ] **Prompt Safety**: Prompts are loaded from the secure backend database. Free users cannot override template prompt guidelines to run arbitrary OpenAI tasks.

## 3. Upload & Payload Safety
- [ ] **Max File Size Limit**: Restricted to a maximum of 10MB payload size in Multer configurations.
- [ ] **Mime Type Constraints**: Strict file filters allowing only `image/jpeg`, `image/png`, and `image/webp`. Extraneous executable binaries or scripts are blocked.

## 4. Admin Panel Security
- [ ] **Token Security**: Sessions are verified using short-lived JSON Web Tokens (JWT) signed with a strong server secret key (`ADMIN_JWT_SECRET`).
- [ ] **Admin Secret Headers**: Non-routing diagnostic endpoints (e.g. `/api/usage`) require the explicit header `x-admin-secret` matching `ADMIN_SECRET`.
- [ ] **Database RLS Policies**: Enable RLS on templates, generations, and app_settings tables. Disable public write permissions; write operations must require service role privileges.

## 5. Deployment Checks
- [ ] **Production CORS Config**: Update backend `allowedOrigins` or `FRONTEND_URL` env variable to allow only the active domains (`https://auralux-umber.vercel.app` or similar) in production.
- [ ] **Disable Development Mock Mode**: Ensure valid `OPENAI_API_KEY` and `CLOUDINARY_API_KEY` are provided in production environment variables to bypass backend mock simulation.
