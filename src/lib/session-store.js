// In-memory session store with 72h expiry
// Resets on Vercel cold start — user just logs in again
const sessionStore = new Map();
const SESSION_TTL = 72 * 60 * 60 * 1000; // 72 hours

export function createSession(userIp) {
  const token = crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_TTL;
  sessionStore.set(token, { userIp, expiresAt, createdAt: Date.now() });
  return { token, expiresAt };
}

export function validateSession(token) {
  const session = sessionStore.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessionStore.delete(token);
    return null;
  }
  return session;
}

export function deleteSession(token) {
  sessionStore.delete(token);
}

// Cleanup stale sessions every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of sessionStore) {
    if (now > val.expiresAt) sessionStore.delete(key);
  }
}, 30 * 60 * 1000);
