import { createOTP } from '@/lib/store';

export const dynamic = 'force-dynamic';

// This endpoint is called by the AI assistant to get the OTP
// and forward it to the user via Feishu.
// In production, it's protected by a simple secret header.
export async function GET(request) {
  // Check for a simple auth header to prevent public access
  const auth = request.headers.get('x-otp-secret');
  const secret = process.env.OTP_SECRET || 'dev-secret';

  if (auth !== secret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Generate a fresh OTP when called
  const otp = createOTP();
  console.log(`[OTP-AI] Generated: ${otp.code}`);

  return Response.json({
    success: true,
    code: otp.code,
    expiresAt: otp.expiresAt,
  });
}
