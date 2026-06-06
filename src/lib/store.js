// In-memory OTP store (resets on Vercel cold start - acceptable for personal dashboard)
const otpStore = new Map();

export function createOTP() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  const otp = { code, expiresAt, used: false, _createdAt: Date.now() };
  otpStore.set(code, otp);
  // Clean up expired OTPs
  for (const [key, val] of otpStore) {
    if (Date.now() > val.expiresAt) otpStore.delete(key);
  }
  return otp;
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

export function getLatestOTP() {
  // Return the most recently created, still-valid OTP
  let latest = null;
  let latestTime = 0;
  for (const [, entry] of otpStore) {
    // entry._createdAt is set by createOTP
    if (entry._createdAt && entry._createdAt > latestTime && !entry.used && Date.now() < entry.expiresAt) {
      latest = entry;
      latestTime = entry._createdAt;
    }
  }
  return latest;
}

export function createOTPWithTimestamp() {
  return createOTP();
}
