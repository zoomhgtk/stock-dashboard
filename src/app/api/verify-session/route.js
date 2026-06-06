import { validateSession } from '@/lib/session-store';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    return Response.json({ valid: false });
  }

  const session = validateSession(token);
  if (!session) {
    // Invalid or expired — clear the cookie
    const response = Response.json({ valid: false });
    response.headers.set(
      'Set-Cookie',
      'session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
    );
    return response;
  }

  return Response.json({ valid: true, user: { name: 'Harry' } });
}
