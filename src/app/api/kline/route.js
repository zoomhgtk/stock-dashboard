import { STOCKS } from '@/lib/stock-data';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || '600036';
  const range = searchParams.get('range') || '1M';

  // Find stock info
  const stock = STOCKS.find(s => s.code === code);
  const market = stock?.market ?? 1;
  const prefix = market === 1 ? 'sh' : 'sz';

  const scaleMap = {
    '1D': '5', '1W': '60', '1M': '240', '3M': '240', '1Y': '240', '5Y': '240',
  };
  const lenMap = {
    '1D': 100, '1W': 120, '1M': 60, '3M': 120, '1Y': 250, '5Y': 1200,
  };
  const scale = scaleMap[range] || '240';
  const len = lenMap[range] || 60;

  const sinaUrl = `https://quotes.sina.cn/cn/api/json_v2.php/CN_MarketData.getKLineData?symbol=${prefix}${code}&scale=${scale}&ma=no&datalen=${len}`;

  try {
    const res = await fetch(sinaUrl, {
      headers: { 'Referer': 'https://finance.sina.com.cn' },
    });
    const text = await res.text();

    // Parse JSONP response
    const jsonStr = text.replace(/^[\s\S]*?\(/, '').replace(/\);?[\s]*$/, '');
    const data = JSON.parse(jsonStr);

    const kline = data.map(d => ({
      time: Math.floor(new Date(d.date || d.day).getTime() / 1000),
      open: parseFloat(d.open),
      high: parseFloat(d.high),
      low: parseFloat(d.low),
      close: parseFloat(d.close),
      volume: parseFloat(d.volume),
    }));

    return Response.json({ kline });
  } catch (e) {
    console.error('K-line proxy error:', e.message);
    return Response.json({ error: e.message, kline: [] }, { status: 500 });
  }
}
