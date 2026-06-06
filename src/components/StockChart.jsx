'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const TIME_RANGES = ['1D', '1W', '1M', '3M', '1Y', '5Y'];

export default function StockChart({ stockCode, stockName, market = 1 }) {
  const chartRef = useRef(null);
  const chartApiRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const [range, setRange] = useState('1M');
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState({ current: 0, change: 0, changePct: 0, high: 0, low: 0, open: 0, prevClose: 0 });

  const fetchData = useCallback(async () => {
    if (!stockCode) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/kline?code=${stockCode}&market=${market}&range=${range}`);
      const data = await res.json();

      if (!data.kline || data.kline.length === 0) {
        throw new Error('No data');
      }

      const klineData = data.kline.map(d => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      const volumeData = data.kline.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(229,57,53,0.3)' : 'rgba(67,160,71,0.3)',
      }));

      if (klineData.length > 0) {
        const last = klineData[klineData.length - 1];
        const prevClose = klineData.length > 1 ? klineData[klineData.length - 2].close : last.open;
        const change = +(last.close - prevClose).toFixed(2);
        const changePct = +((change / prevClose) * 100).toFixed(2);
        setPrice({
          current: last.close,
          change,
          changePct,
          high: Math.max(...klineData.map(d => d.high)),
          low: Math.min(...klineData.map(d => d.low)),
          open: klineData[0]?.open || 0,
          prevClose,
        });
      }

      if (candlestickSeriesRef.current) {
        candlestickSeriesRef.current.setData(klineData);
        volumeSeriesRef.current?.setData(volumeData);
      }
    } catch (e) {
      console.error('Chart data error:', e);
    }
    setLoading(false);
  }, [stockCode, market, range]);

  useEffect(() => {
    if (!chartRef.current) return;

    import('lightweight-charts').then(({ createChart }) => {
      if (chartApiRef.current) {
        chartApiRef.current.remove();
      }

      const chart = createChart(chartRef.current, {
        width: chartRef.current.clientWidth,
        height: 420,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#86868b',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        crosshair: {
          mode: 0,
          vertLine: { color: '#c7c7cc', width: 1, style: 3 },
          horzLine: { color: '#c7c7cc', width: 1, style: 3 },
        },
        timeScale: {
          borderColor: '#e5e5e7',
          timeVisible: range === '1D',
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: '#e5e5e7',
          scaleMargins: { top: 0.1, bottom: 0.3 },
        },
        handleScroll: false,
        handleScale: false,
      });

      // Candlestick series - RED up, GREEN down (A-share convention)
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#e53935',
        downColor: '#43a047',
        borderUpColor: '#e53935',
        borderDownColor: '#43a047',
        wickUpColor: '#e53935',
        wickDownColor: '#43a047',
        priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      });

      // Volume series
      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      candlestickSeriesRef.current = candlestickSeries;
      volumeSeriesRef.current = volumeSeries;
      chartApiRef.current = chart;

      fetchData();

      // Resize handler
      const handleResize = () => {
        if (chartRef.current) {
          chart.applyOptions({ width: chartRef.current.clientWidth });
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    });
  }, [stockCode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (chartApiRef.current) fetchData();
  }, [range, fetchData]);

  const isUp = price.change >= 0;

  return (
    <div className="chart-container p-4">
      {/* Header: stock name + price */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold text-[#1d1d1f]">{stockName || '选择股票'}</h2>
          {stockCode && <span className="text-xs text-[#86868b]">{stockCode}</span>}
        </div>
        {stockCode && (
          <div className="text-right">
            <div className={`text-3xl font-semibold ${isUp ? 'price-up' : 'price-down'}`}>
              {price.current.toFixed(2)}
            </div>
            <div className={`text-sm font-medium ${isUp ? 'price-up' : 'price-down'}`}>
              {isUp ? '+' : ''}{price.change.toFixed(2)} ({isUp ? '+' : ''}{price.changePct.toFixed(2)}%)
            </div>
          </div>
        )}
      </div>

      {/* Segmented control */}
      <div className="segmented-control mb-4 w-fit">
        {TIME_RANGES.map(r => (
          <button key={r} className={r === range ? 'active' : ''} onClick={() => setRange(r)}>
            {r}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div ref={chartRef} className="w-full" style={{ minHeight: 420 }}>
        {loading && <div className="shimmer w-full h-[420px] rounded-lg" />}
      </div>

      {/* Key stats */}
      {stockCode && (
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-[#e5e5e7]">
          {[
            { label: '开盘', value: price.open.toFixed(2) },
            { label: '最高', value: price.high.toFixed(2) },
            { label: '最低', value: price.low.toFixed(2) },
            { label: '昨收', value: price.prevClose.toFixed(2) },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-xs text-[#86868b]">{s.label}</div>
              <div className="text-sm font-semibold text-[#1d1d1f] mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
