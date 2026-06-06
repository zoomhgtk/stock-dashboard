import { createOTP, getLatestOTP } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;

  const diagnostics = {
    envVarsSet: {
      FEISHU_APP_ID: !!appId,
      FEISHU_APP_SECRET: !!appSecret,
    },
    envVarsLength: {
      FEISHU_APP_ID: appId?.length || 0,
      FEISHU_APP_SECRET: appSecret?.length || 0,
    },
  };

  if (!appId || !appSecret) {
    return Response.json({ ...diagnostics, error: 'Env vars not set' }, { status: 400 });
  }

  // Try to get a Feishu token
  try {
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    });
    const tokenResult = await tokenRes.json();
    diagnostics.tokenResult = {
      code: tokenResult.code,
      ok: tokenResult.code === 0,
    };

    if (tokenResult.code === 0) {
      // Try to write a test record
      const writeRes = await fetch(
        'https://open.feishu.cn/open-apis/bitable/v1/apps/UvzBbyLiRabEApsSfKccTYs4nee/tables/tblTOz4qiuPQNFK2/records',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Authorization: `Bearer ${tokenResult.tenant_access_token}`,
          },
          body: JSON.stringify({
            fields: {
              '状态': 'pending',
              'OTP码': 'DIAG',
              '过期时间': Date.now() + 300000,
              '创建IP': 'vercel-diag',
            },
          }),
        }
      );
      const writeResult = await writeRes.json();
      diagnostics.writeResult = {
        code: writeResult.code,
        ok: writeResult.code === 0,
      };
    }
  } catch (e) {
    diagnostics.fetchError = e.message;
  }

  return Response.json(diagnostics);
}
