// Central config — reads from environment variables
// In dev: uses localhost. In production: uses the Railway URL set in Vercel env vars.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default BACKEND_URL;
