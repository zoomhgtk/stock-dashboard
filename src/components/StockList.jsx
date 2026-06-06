'use client';

import { useState, useEffect } from 'react';

export default function StockList({ onSelectStock, selectedStock }) {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/stocks');
        const data = await res.json();
        setStocks(data.prices || []);
      } catch (e) {
        console.error('Failed to load stocks:', e);
      }
      setLoading(false);
    }
    load();
    // Refresh every 60s
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="shimmer h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#e5e5e7]">
        <div className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
          实时行情
        </div>
      </div>

      {/* Stock rows */}
      <div className="divide-y divide-[#e5e5e7]">
        {stocks.map((stock, i) => {
          const isUp = stock.change >= 0;
          return (
            <button
              key={stock.code}
              className={`w-full flex items-center px-4 py-3 hover:bg-[#f5f5f7] transition-colors ${
                selectedStock === stock.code ? 'bg-[#f0f5ff]' : ''
              }`}
              onClick={() => onSelectStock?.(stock.code, stock.name)}
            >
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-[#1d1d1f]">{stock.name}</div>
                <div className="text-[11px] text-[#86868b] mt-0.5">{stock.code}</div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold ${isUp ? 'price-up' : 'price-down'}`}>
                  {stock.price.toFixed(2)}
                </div>
                <div className={`text-[11px] font-medium ${isUp ? 'price-up' : 'price-down'}`}>
                  {isUp ? '+' : ''}{stock.changePct.toFixed(2)}%
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
