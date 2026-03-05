// app/api/auth/[...nextauth]/route.ts
// NextAuth.js v5 catch-all route handler.
// All auth-related requests (/api/auth/signin, /api/auth/callback, etc.) are
// handled automatically by the handlers exported from auth.ts.

import { handlers } from '@/auth';

export const { GET, POST } = handlers;
