export const dynamic = 'force-dynamic';

// A股自选股票列表
export const STOCKS = [
  { code: '600036', name: '招商银行', market: 1 },
  { code: '600795', name: '国电电力', market: 1 },
  { code: '600690', name: '海尔智家', market: 1 },
  { code: '600941', name: '中国移动', market: 1 },
  { code: '601066', name: '中信建投', market: 1 },
  { code: '000538', name: '云南白药', market: 0 },
  { code: '601166', name: '兴业银行', market: 1 },
  { code: '000423', name: '东阿阿胶', market: 0 },
  { code: '600887', name: '伊利股份', market: 1 },
  { code: '601318', name: '中国平安', market: 1 },
  { code: '601336', name: '新华保险', market: 1 },
  { code: '601857', name: '中国石油', market: 1 },
  { code: '600028', name: '中国石化', market: 1 },
  { code: '600519', name: '贵州茅台', market: 1 },
  { code: '600886', name: '国投电力', market: 1 },
  { code: '600900', name: '长江电力', market: 1 },
  { code: '600938', name: '中国海油', market: 1 },
  { code: '601728', name: '中国电信', market: 1 },
  { code: '601919', name: '中远海控', market: 1 },
  { code: '000568', name: '泸州老窖', market: 0 },
  { code: '600011', name: '华能国际', market: 1 },
];

function secId(code, market) {
  return `${market}.${code}`;
}

export async function fetchRealtimePrices() {
  const sinaCodes = STOCKS.map(s => {
    const prefix = s.market === 1 ? 'sh' : 'sz';
    return `${prefix}${s.code}`;
  }).join(',');

  const url = `https://hq.sinajs.cn/list=${sinaCodes}`;
  const res = await fetch(url, {
    headers: { 'Referer': 'https://finance.sina.com.cn' },
    next: { revalidate: 60 },
  });
  const text = await res.text();
  const lines = text.split('\n').filter(l => l.trim());

  return lines.map((line, i) => {
    const match = line.match(/"(.*)"/);
    if (!match) return null;
    const fields = match[1].split(',');
    const stock = STOCKS[i];
    return {
      code: stock.code,
      name: stock.name,
      open: parseFloat(fields[1]) || 0,
      prevClose: parseFloat(fields[2]) || 0,
      price: parseFloat(fields[3]) || 0,
      high: parseFloat(fields[4]) || 0,
      low: parseFloat(fields[5]) || 0,
      volume: parseFloat(fields[6]) || 0,
      amount: parseFloat(fields[7]) || 0,
      change: parseFloat(fields[3]) - parseFloat(fields[2]) || 0,
      changePct: parseFloat(fields[2]) ? ((parseFloat(fields[3]) - parseFloat(fields[2])) / parseFloat(fields[2]) * 100) : 0,
      time: fields[30] || '',
    };
  }).filter(Boolean);
}

export async function fetchKline(code, market = 1, range = '240') {
  // scale: 5=5min, 15=15min, 30=30min, 60=60min, 240=daily, 周线=weekly, 月线=monthly
  const scaleMap = {
    '1D': '5',
    '1W': '60',
    '1M': '240',
    '3M': '240',
    '1Y': '240',
    '5Y': '240',
  };
  const scale = scaleMap[range] || '240';

  const lenMap = {
    '1D': 100,
    '1W': 120,
    '1M': 60,
    '3M': 120,
    '1Y': 250,
    '5Y': 1200,
  };
  const len = lenMap[range] || 60;

  const prefix = market === 1 ? 'sh' : 'sz';
  const sinaUrl = `https://quotes.sina.cn/cn/api/json_v2.php/CN_MarketData.getKLineData?symbol=${prefix}${code}&scale=${scale}&ma=no&datalen=${len}`;

  try {
    const res = await fetch(sinaUrl, {
      headers: { 'Referer': 'https://finance.sina.com.cn' },
      next: { revalidate: 300 },
    });
    const text = await res.text();
    // Parse the JSONP response
    const jsonStr = text.replace(/^.*?\(/, '').replace(/\);?$/, '');
    const data = JSON.parse(jsonStr);
    return data.map(d => ({
      time: Math.floor(new Date(d.date || d.day).getTime() / 1000),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }));
  } catch (e) {
    console.error('Failed to fetch kline:', e);
    return generateMockKline(code, range);
  }
}

function generateMockKline(code, range) {
  const count = range === '1D' ? 50 : range === '1W' ? 120 : range === '1M' ? 60 : 250;
  const basePrice = 30 + (parseInt(code.slice(-3), 16) % 50);
  const data = [];
  let price = basePrice;
  const now = new Date();
  for (let i = count; i >= 0; i--) {
    const date = new Date(now);
    if (range === '1D') date.setMinutes(date.getMinutes() - i * 5);
    else date.setDate(date.getDate() - i);

    const change = (Math.random() - 0.48) * basePrice * 0.03;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * basePrice * 0.01;
    const low = Math.min(open, close) - Math.random() * basePrice * 0.01;
    const volume = Math.floor(Math.random() * 5000000) + 100000;

    data.push({
      time: Math.floor(date.getTime() / 1000),
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume,
    });
    price = close;
  }
  return data;
}
