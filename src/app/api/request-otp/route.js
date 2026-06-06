import { createOTP } from '@/lib/store';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const FEISHU_APP_TOKEN = 'UvzBbyLiRabEApsSfKccTYs4nee';
const FEISHU_TABLE_ID = 'tblTOz4qiuPQNFK2';

async function writeOtpToFeishuQueue(otp, ip) {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;

  if (!appId || !appSecret) {
    console.warn('[OTP] FEISHU_APP_ID/FEISHU_APP_SECRET not configured; skipping queue write');
    return;
  }

  const tokenResponse = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  const tokenResult = await tokenResponse.json();
  if (!tokenResponse.ok || tokenResult.code !== 0) {
    throw new Error(`Failed to get Feishu tenant token: ${JSON.stringify(tokenResult)}`);
  }

  const recordResponse = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_TABLE_ID}/records`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${tokenResult.tenant_access_token}`,
      },
      body: JSON.stringify({
        fields: {
          '状态': 'pending',
          'OTP码': otp.code,
          '过期时间': otp.expiresAt,
          '创建IP': ip,
        },
      }),
    },
  );
  const recordResult = await recordResponse.json();
  if (!recordResponse.ok || recordResult.code !== 0) {
    throw new Error(`Failed to write Feishu OTP queue record: ${JSON.stringify(recordResult)}`);
  }
}

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

  // Await Feishu queue write with timeout to keep function alive on Vercel serverless
  try {
    await Promise.race([
      writeOtpToFeishuQueue(otp, ip),
      new Promise(resolve => setTimeout(resolve, 5000)), // 5s timeout
    ]);
  } catch (error) {
    console.error('[OTP] Failed to write Feishu queue record:', error);
  }

  return Response.json({
    success: true,
    message: 'OTP sent to your Feishu — 请查看飞书消息',
    // In dev mode, return the code for testing
    ...(isDev ? { code: otp.code } : {}),
  });
}
