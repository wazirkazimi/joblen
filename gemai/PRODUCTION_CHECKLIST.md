# Production Security & Cost Protection Checklist

Verify each of the following configurations before launching the Auralux AI MVP to production.

## Environment & Keys Security
- [ ] `.env` is not committed to the Git repository (verified in `.gitignore`)
- [ ] OpenAI API key is stored strictly in secure server-side environment variables (e.g. Render, Vercel backend)
- [ ] Cloudinary secret key is stored strictly in secure server-side environment variables
- [ ] Frontend codebase has no API secrets or keys embedded in variables or text files
- [ ] Render or deployment service logs do not print API keys during startup or error prints

## Backend Security Safeguards
- [ ] `/api/generate` has active IP rate limit (max 3/hour, max 10/day)
- [ ] Backend limits upload size to 10MB using Multer limit settings
- [ ] Backend file filters reject all uploads that are not `image/jpeg`, `image/png`, or `image/webp`
- [ ] Backend selects prompts strictly from hardcoded server templates via `templateId` (does not accept custom client prompts)
- [ ] CORS configuration restricts origins to the production frontend domain (`FRONTEND_URL`) in production
- [ ] `/api/usage` admin status query is protected by verifying the `x-admin-secret` header against the server's `ADMIN_SECRET` variable

## Cost Protection & Caps
- [ ] Backend enforces a hard total generation cap (`OPENAI_MAX_GENERATIONS` - target 180)
- [ ] Backend enforces a hard daily generation cap (`OPENAI_DAILY_MAX_GENERATIONS` - target 30)
- [ ] OpenAI dashboard project budget limits are hard-configured close to the $5 MVP budget
- [ ] Cloudinary account has unsigned uploads disabled for safety

## Deployment Validation Tests
- [ ] Test that a sample image generation works end-to-end under low-cost settings
- [ ] Test the blocked state error message by setting a low limit and verifying the WhatsApp contact redirection
- [ ] Test invalid file upload rejection (attempting to send a `.txt` or `.zip` file)
- [ ] Test that `GET /api/usage` returns a `401 Unauthorized` response when requested without a valid `x-admin-secret` header
