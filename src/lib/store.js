// In-memory OTP store (resets on Vercel cold start - acceptable for personal dashboard)
const otpStore = new Map();

export function createOTP() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(code, { code, expiresAt, used: false });
  // Clean up expired OTPs
  for (const [key, val] of otpStore) {
    if (Date.now() > val.expiresAt) otpStore.delete(key);
  }
  return code;
}

export function verifyOTP(code) {
  const entry = otpStore.get(code);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(code);
    return false;
  }
  if (entry.used) return false;
  entry.used = true;
  otpStore.delete(code);
  return true;
}
