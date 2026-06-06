import { STOCKS, fetchRealtimePrices } from '@/lib/stock-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const prices = await fetchRealtimePrices();
    return Response.json({ stocks: STOCKS, prices });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
