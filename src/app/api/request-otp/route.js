import { createOTP } from '@/lib/store';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  // Rate limit: max 100 OTP requests per 15 minutes per IP
  const limit = checkRateLimit(ip, 'request-otp', 100, 15 * 60 * 1000);
  if (!limit.allowed) {
    return Response.json({
      success: false,
      error: `请求过于频繁，请在 ${Math.ceil(limit.retryAfter / 60)} 分钟后重试`,
    }, { status: 429 });
  }

  const otp = createOTP();
  const isDev = process.env.NODE_ENV === 'development';

  console.log(`[OTP] Generated for ${ip}: ${otp.code}`);

  return Response.json({
    success: true,
    message: 'OTP sent to your Feishu — 请查看飞书消息',
    ...(isDev ? { code: otp.code } : {}),
  });
}
