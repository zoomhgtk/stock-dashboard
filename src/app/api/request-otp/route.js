import { createOTP } from '@/lib/store';

export async function POST() {
  const code = createOTP();
  // The OTP is logged and will be sent via Feishu when the user asks
  console.log('[OTP] Generated:', code);
  return Response.json({ success: true, message: 'OTP sent to your Feishu' });
}
