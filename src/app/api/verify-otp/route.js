import { verifyOTP } from '@/lib/store';
import { checkRateLimit } from '@/lib/rate-limit';
import { createSession } from '@/lib/session-store';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  // Rate limit: max 100 verify attempts per 15 minutes per IP
  const limit = checkRateLimit(ip, 'verify-otp', 100, 15 * 60 * 1000);
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
    // Create persistent session (72h)
    const session = createSession(ip);

    // Set session cookie
    const response = Response.json({
      success: true,
      token: session.token,
      user: { name: 'Harry' },
    });

    response.headers.set(
      'Set-Cookie',
      `session_token=${session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${72 * 3600}`
    );

    return response;
  }

  return Response.json({
    success: false,
    error: '验证码无效或已过期，请重新获取',
  }, { status: 401 });
}
