import { verifyOTP } from '@/lib/store';

export async function POST(request) {
  const { code } = await request.json();
  if (!code || code.length !== 6) {
    return Response.json({ success: false, error: 'Invalid code' }, { status: 400 });
  }
  if (verifyOTP(code)) {
    // Create a simple session token (for a personal dashboard, a simple approach is fine)
    const token = Buffer.from(`session:${Date.now()}`).toString('base64');
    return Response.json({
      success: true,
      token,
      user: { name: 'Harry' },
    });
  }
  return Response.json({ success: false, error: 'Invalid or expired code' }, { status: 401 });
}
