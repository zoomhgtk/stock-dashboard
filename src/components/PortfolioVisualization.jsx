'use client';

const TOTAL_CAPITAL_WAN = 35;
const TOTAL_POSITION = 61.8;
const CASH_POSITION = 38.2;
const TREASURY_YIELD = 1.71;
const STOCK_LIMIT = 10;
const SECTOR_LIMIT = 20;

const positions = [
  { name: '招商银行', shortName: '招行', value: 55.1, trackedPct: 89.2, color: '#007aff' },
  { name: '海尔智家', shortName: '海尔', value: 5.2, trackedPct: 8.4, color: '#f5a623' },
  { name: '伊利股份', shortName: '伊利', value: 1.5, trackedPct: 2.4, color: '#43a047' },
  { name: '现金', shortName: '现金', value: CASH_POSITION, color: '#e5e5e7' },
];

const sectors = [
  { name: '银行', value: 55.1, color: '#e53935', limit: SECTOR_LIMIT },
  { name: '家电', value: 5.2, color: '#f5a623', limit: SECTOR_LIMIT },
  { name: '食品饮料', value: 1.5, color: '#43a047', limit: SECTOR_LIMIT },
];

const constraintItems = [
  {
    name: '招商银行',
    value: 55.1,
    limit: STOCK_LIMIT,
    status: '>> 10%上限 🚨',
    note: '单股集中度严重超标',
    color: '#e53935',
  },
  {
    name: '银行板块',
    value: 55.1,
    limit: SECTOR_LIMIT,
    status: '>> 20%上限 🚨',
    note: '板块集中度严重超标',
    color: '#e53935',
  },
  {
    name: '海尔智家',
    value: 5.2,
    limit: STOCK_LIMIT,
    status: '待清仓 · 浮亏21.1%',
    note: '低于单股上限，仍需观察退出',
    color: '#f5a623',
  },
];

const formatPct = value => `${value.toFixed(1)}%`;
const holdingValueWan = (TOTAL_CAPITAL_WAN * TOTAL_POSITION) / 100;

function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y, 'L', cx, cy, 'Z'].join(' ');
}

function OverviewCard({ label, value, subValue, accent = '#007aff', children }) {
  return (
    <div className="rounded-2xl bg-[#f5f5f7] p-4 shadow-sm ring-1 ring-black/[0.03]">
      <div className="text-xs font-medium text-[#86868b]">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-[#1d1d1f]" style={{ color: accent }}>
        {value}
      </div>
      {subValue && <div className="mt-1 text-xs text-[#86868b]">{subValue}</div>}
      {children}
    </div>
  );
}

function PieChart() {
  let currentAngle = 0;
  const slices = positions.map(item => {
    const startAngle = currentAngle;
    const endAngle = currentAngle + (item.value / 100) * 360;
    currentAngle = endAngle;
    const midAngle = (startAngle + endAngle) / 2;
    const labelPoint = polarToCartesian(110, 110, 76, midAngle);

    return { ...item, startAngle, endAngle, labelPoint };
  });

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#1d1d1f]">持仓占比饼图</h3>
          <p className="mt-0.5 text-xs text-[#86868b]">已跟踪仓位 {formatPct(TOTAL_POSITION)} · 现金 {formatPct(CASH_POSITION)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <svg viewBox="0 0 220 220" className="h-56 w-56 max-w-full" role="img" aria-label="持仓占比饼图">
          {slices.map(slice => (
            <g key={slice.name}>
              <path
                d={describeArc(110, 110, 96, slice.startAngle, slice.endAngle)}
                fill={slice.color}
                stroke="#ffffff"
                strokeWidth="3"
              />
              <text
                x={slice.labelPoint.x}
                y={slice.labelPoint.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white text-[11px] font-semibold"
                style={{ fill: slice.name === '现金' ? '#86868b' : '#ffffff' }}
              >
                {formatPct(slice.value)}
              </text>
            </g>
          ))}
          <circle cx="110" cy="110" r="48" fill="#ffffff" />
          <text x="110" y="104" textAnchor="middle" className="fill-[#86868b] text-[12px] font-medium">总仓位</text>
          <text x="110" y="126" textAnchor="middle" className="fill-[#1d1d1f] text-[24px] font-semibold">61.8%</text>
        </svg>

        <div className="mt-3 grid w-full grid-cols-2 gap-2 text-xs">
          {positions.map(item => (
            <div key={item.name} className="flex items-center gap-2 rounded-xl bg-[#f5f5f7] px-3 py-2">
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <div className="min-w-0">
                <div className="truncate font-medium text-[#1d1d1f]">{item.name}</div>
                <div className="text-[#86868b]">
                  {formatPct(item.value)}{item.trackedPct ? ` · 已持仓 ${formatPct(item.trackedPct)}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectorDistribution() {
  const maxScale = 60;
  const limitLeft = (SECTOR_LIMIT / maxScale) * 100;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[#1d1d1f]">板块分布</h3>
          <p className="mt-0.5 text-xs text-[#86868b]">板块上限 {formatPct(SECTOR_LIMIT)} · 合计 {formatPct(TOTAL_POSITION)}</p>
        </div>
        <span className="rounded-full bg-[#fff2f2] px-2 py-1 text-xs font-medium text-[#e53935]">银行超限</span>
      </div>

      <div className="mt-5">
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-[#1d1d1f]">持仓板块堆叠</span>
            <span className="text-[#86868b]">{formatPct(TOTAL_POSITION)}</span>
          </div>
          <div className="flex h-4 overflow-hidden rounded-full bg-[#f2f2f7]">
            {sectors.map(sector => (
              <div
                key={sector.name}
                title={`${sector.name} ${formatPct(sector.value)}`}
                style={{ width: `${sector.value}%`, backgroundColor: sector.color }}
              />
            ))}
          </div>
        </div>

        <div className="relative space-y-4 pt-5">
          <div
            className="absolute bottom-0 top-2 border-l border-dashed border-[#e53935]"
            style={{ left: `${limitLeft}%` }}
          >
            <span className="absolute -top-5 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-1.5 text-[11px] font-medium text-[#e53935]">
              板块上限
            </span>
          </div>

          {sectors.map(sector => {
            const width = Math.min((sector.value / maxScale) * 100, 100);
            const exceeded = sector.value > sector.limit;
            return (
              <div key={sector.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-[#1d1d1f]">
                    {sector.name}{exceeded ? ' 🚨' : ''}
                  </span>
                  <span className={exceeded ? 'font-semibold text-[#e53935]' : 'text-[#86868b]'}>{formatPct(sector.value)}</span>
                </div>
                <div className="h-7 rounded-full bg-[#f5f5f7] p-1">
                  <div
                    className="flex h-full items-center justify-end rounded-full px-2 text-[11px] font-semibold text-white transition-all"
                    style={{ width: `${width}%`, minWidth: sector.value > 0 ? 28 : 0, backgroundColor: sector.color }}
                  >
                    {formatPct(sector.value)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ConstraintBar({ item }) {
  const maxScale = 60;
  const barWidth = Math.min((item.value / maxScale) * 100, 100);
  const limitLeft = (item.limit / maxScale) * 100;
  const exceeded = item.value > item.limit;

  return (
    <div className={`rounded-2xl p-4 shadow-sm ring-1 ${exceeded ? 'bg-[#fff7f7] ring-[#e53935]/15' : 'bg-[#fffaf2] ring-[#f5a623]/15'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[#1d1d1f]">{item.name}</div>
          <div className="mt-1 text-xs text-[#86868b]">{item.note}</div>
        </div>
        <div className={`text-right text-xs font-semibold ${exceeded ? 'text-[#e53935]' : 'text-[#b26a00]'}`}>
          <div>{formatPct(item.value)}</div>
          <div>{item.status}</div>
        </div>
      </div>

      <div className="relative mt-4 pt-4">
        <div
          className="absolute bottom-0 top-0 border-l border-dashed border-[#e53935]"
          style={{ left: `${limitLeft}%` }}
        >
          <span className="absolute -top-4 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-[#e53935]">
            {formatPct(item.limit)}上限
          </span>
        </div>
        <div className="h-8 rounded-full bg-white p-1 shadow-inner">
          <div
            className="flex h-full items-center justify-end rounded-full px-2 text-[11px] font-semibold text-white"
            style={{ width: `${barWidth}%`, minWidth: 34, backgroundColor: item.color }}
          >
            {formatPct(item.value)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioVisualization() {
  return (
    <section className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-black/[0.04] backdrop-blur" aria-label="Portfolio visualization">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#1d1d1f]">组合可视化</h2>
          <p className="mt-0.5 text-xs text-[#86868b]">六月持仓 · 仓位分布 · 约束风险</p>
        </div>
        <div className="rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-medium text-[#86868b]">
          基准资金 {TOTAL_CAPITAL_WAN}万
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <OverviewCard label="总仓位" value={formatPct(TOTAL_POSITION)} subValue={`剩余现金 ${formatPct(CASH_POSITION)}`}>
          <div className="mt-3 h-2 rounded-full bg-[#e5e5e7]">
            <div className="h-full rounded-full bg-[#007aff]" style={{ width: `${TOTAL_POSITION}%` }} />
          </div>
        </OverviewCard>
        <OverviewCard label="持仓市值" value={`≈${holdingValueWan.toFixed(1)}万`} subValue="35万基准 × 61.8%" accent="#1d1d1f" />
        <OverviewCard
          label="10年国债"
          value={formatPct(TREASURY_YIELD)}
          subValue={`3倍国债 = ${formatPct(TREASURY_YIELD * 3)}`}
          accent="#43a047"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PieChart />
        <SectorDistribution />
      </div>

      <div className="mt-4 rounded-2xl bg-[#f5f5f7] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#1d1d1f]">仓位约束状况</h3>
            <p className="mt-0.5 text-xs text-[#86868b]">红色虚线为对应上限，条形越线代表超标</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {constraintItems.map(item => (
            <ConstraintBar key={item.name} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
