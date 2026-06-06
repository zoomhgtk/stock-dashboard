'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import LoginModal from '@/components/LoginModal';
import AlertSidebar from '@/components/AlertSidebar';
import PortfolioVisualization from '@/components/PortfolioVisualization';
import StockChart from '@/components/StockChart';
import StockList from '@/components/StockList';

const STOCK_MAP = {
  '招商银行': { code: '600036', market: 1 },
  '国电电力': { code: '600795', market: 1 },
  '海尔智家': { code: '600690', market: 1 },
  '中国移动': { code: '600941', market: 1 },
  '中信建投': { code: '601066', market: 1 },
  '云南白药': { code: '000538', market: 0 },
  '兴业银行': { code: '601166', market: 1 },
  '东阿阿胶': { code: '000423', market: 0 },
  '伊利股份': { code: '600887', market: 1 },
  '中国平安': { code: '601318', market: 1 },
  '新华保险': { code: '601336', market: 1 },
  '中国石油': { code: '601857', market: 1 },
  '中国石化': { code: '600028', market: 1 },
  '贵州茅台': { code: '600519', market: 1 },
  '国投电力': { code: '600886', market: 1 },
  '长江电力': { code: '600900', market: 1 },
  '中国海油': { code: '600938', market: 1 },
  '中国电信': { code: '601728', market: 1 },
  '中远海控': { code: '601919', market: 1 },
  '泸州老窖': { code: '000568', market: 0 },
  '华能国际': { code: '600011', market: 1 },
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true); // checking session
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedCode, setSelectedCode] = useState('600036');
  const [selectedName, setSelectedName] = useState('招商银行');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [portfolioCollapsed, setPortfolioCollapsed] = useState(false);
  const [showAmounts, setShowAmounts] = useState(true);
  const centerScrollRef = useRef(null);
  const chartRef = useRef(null);
  const portfolioRef = useRef(null);

  // On mount, check if we have a valid session cookie
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/verify-session');
        const data = await res.json();
        if (data.valid) {
          setAuthenticated(true);
        }
      } catch {
        // Network error — show login
      }
      setLoading(false);
    })();
  }, []);

  const scrollChartIntoView = useCallback(() => {
    window.requestAnimationFrame(() => {
      chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const handleCenterScroll = useCallback(() => {
    const container = centerScrollRef.current;
    const threshold = Math.max((portfolioRef.current?.offsetHeight || 0) - 24, 120);
    setShowBackToTop((container?.scrollTop || 0) > threshold);
  }, []);

  const handleBackToTop = useCallback(() => {
    centerScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLogin = useCallback((token, user) => {
    console.log('Login:', user);
    setAuthenticated(true);
  }, []);

  const handleSelectStock = useCallback((code, name) => {
    if (code && name) {
      setSelectedCode(code);
      setSelectedName(name);
      scrollChartIntoView();
    }
  }, [scrollChartIntoView]);

  const handleSelectStockByName = useCallback((name) => {
    const stock = STOCK_MAP[name];
    if (stock) {
      setSelectedCode(stock.code);
      setSelectedName(name);
      scrollChartIntoView();
    }
  }, [scrollChartIntoView]);

  // While checking session, show nothing (prevents flash of login screen)
  if (loading) return null;

  if (!authenticated) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-[#f5f5f7] overflow-hidden">
      {/* Left sidebar - alerts */}
      <div className="w-[280px] flex-shrink-0" style={{ minWidth: 280 }}>
        <AlertSidebar onSelectStock={handleSelectStockByName} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
        {/* Header strip */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#1d1d1f]">A股 Stock Dashboard</h1>
            <p className="text-xs text-[#86868b] mt-0.5">
              故事收盘报告 · 实时行情 · 预警监测
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-[#86868b]">
              数据来源: 新浪财经 · 自动刷新
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-[#007aff] hover:text-[#0066d6] font-medium"
            >
              刷新
            </button>
          </div>
        </div>

        {/* Two-column layout: Chart + Stock list */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Chart area */}
          <div
            ref={centerScrollRef}
            onScroll={handleCenterScroll}
            className="relative flex-1 overflow-y-auto scroll-smooth pr-1"
          >
            <div className="flex min-w-0 flex-col gap-4">
              <div ref={portfolioRef}>
                <PortfolioVisualization
                  collapsed={portfolioCollapsed}
                  onToggleCollapsed={() => setPortfolioCollapsed(value => !value)}
                  showAmounts={showAmounts}
                  onToggleAmounts={() => setShowAmounts(value => !value)}
                />
              </div>
              <div ref={chartRef} className="relative scroll-mt-2">
                <StockChart
                  stockCode={selectedCode}
                  stockName={selectedName}
                  market={STOCK_MAP[selectedName]?.market || 1}
                />
                <button
                  type="button"
                  onClick={handleBackToTop}
                  className={`absolute bottom-6 right-6 z-30 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#007aff] shadow-[0_12px_30px_rgba(0,0,0,0.16)] ring-1 ring-black/[0.06] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white ${
                    showBackToTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
                  }`}
                  aria-label="回到顶部"
                >
                  ↑ 回到顶部
                </button>
              </div>
            </div>
          </div>

          {/* Right: stock list */}
          <div className="w-[260px] flex-shrink-0 overflow-y-auto">
            <StockList onSelectStock={handleSelectStock} selectedStock={selectedCode} />
          </div>
        </div>
      </div>
    </div>
  );
}
