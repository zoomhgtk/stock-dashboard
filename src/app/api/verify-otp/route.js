import { verifyOTP } from '@/lib/store';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  // Rate limit: max 5 verify attempts per 15 minutes per IP
  const limit = checkRateLimit(ip, 'verify-otp', 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return Response.json({
      success: false,
      error: `验证尝试过多，请在 ${Math.ceil(limit.retryAfter / 60)} 分钟后重试`,
    }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: '请求格式错误' }, { status: 400 });
  }

  const { code } = body;
  if (!code || typeof code !== 'string' || code.length !== 6 || !/^\d{6}$/.test(code)) {
    return Response.json({ success: false, error: '验证码格式错误' }, { status: 400 });
  }

  if (verifyOTP(code)) {
    // Generate a simple session token
    const sessionId = Buffer.from(`session:${Date.now()}:${Math.random().toString(36).slice(2)}`).toString('base64');
    return Response.json({
      success: true,
      token: sessionId,
      user: { name: 'Harry' },
    });
  }

  return Response.json({
    success: false,
    error: '验证码无效或已过期，请重新获取',
  }, { status: 401 });
}
