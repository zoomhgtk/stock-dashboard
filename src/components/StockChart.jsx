'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const TIME_RANGES = ['1D', '1W', '1M', '3M', '1Y', '5Y'];
const CHART_HEIGHT = 420;
const UP_COLOR = '#e53935'; // A 股习惯：红涨
const DOWN_COLOR = '#43a047'; // A 股习惯：绿跌

const formatPrice = value => (Number.isFinite(Number(value)) ? Number(value).toFixed(2) : '--');

const formatVolume = value => {
  const volume = Number(value);
  if (!Number.isFinite(volume)) return '--';
  if (volume >= 100000000) return `${(volume / 100000000).toFixed(2)}亿`;
  if (volume >= 10000) return `${(volume / 10000).toFixed(2)}万`;
  return volume.toLocaleString('zh-CN');
};

const formatDate = time => {
  if (!time) return '--';

  if (typeof time === 'number') {
    return new Date(time * 1000).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  // lightweight-charts BusinessDay: { year, month, day }
  if (typeof time === 'object' && 'year' in time && 'month' in time && 'day' in time) {
    return `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`;
  }

  return String(time);
};

const timeKey = time => {
  if (typeof time === 'object' && time !== null) {
    return `${time.year}-${time.month}-${time.day}`;
  }
  return String(time);
};

export default function StockChart({ stockCode, stockName, market = 1 }) {
  const chartRef = useRef(null);
  const tooltipRef = useRef(null);
  const chartApiRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const klineByTimeRef = useRef(new Map());
  const [range, setRange] = useState('1M');
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState({ current: 0, change: 0, changePct: 0, high: 0, low: 0, open: 0, prevClose: 0 });

  const hideTooltip = useCallback(() => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'none';
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!stockCode) {
      setLoading(false);
      klineByTimeRef.current = new Map();
      candlestickSeriesRef.current?.setData([]);
      volumeSeriesRef.current?.setData([]);
      hideTooltip();
      return;
    }

    setLoading(true);
    hideTooltip();

    try {
      const res = await fetch(`/api/kline?code=${stockCode}&market=${market}&range=${range}`);
      const data = await res.json();

      if (!data.kline || data.kline.length === 0) {
        throw new Error('No data');
      }

      const enrichedData = data.kline.map((d, index, arr) => {
        const prevClose = index > 0 ? Number(arr[index - 1].close) : Number(d.open);
        const close = Number(d.close);
        const changePct = prevClose ? ((close - prevClose) / prevClose) * 100 : 0;

        return {
          time: d.time,
          open: Number(d.open),
          high: Number(d.high),
          low: Number(d.low),
          close,
          volume: Number(d.volume),
          prevClose,
          changePct,
        };
      });

      const klineData = enrichedData.map(({ time, open, high, low, close }) => ({
        time,
        open,
        high,
        low,
        close,
      }));

      const volumeData = enrichedData.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(229,57,53,0.35)' : 'rgba(67,160,71,0.35)',
      }));

      klineByTimeRef.current = new Map(enrichedData.map(d => [timeKey(d.time), d]));

      if (enrichedData.length > 0) {
        const last = enrichedData[enrichedData.length - 1];
        const prevClose = enrichedData.length > 1 ? enrichedData[enrichedData.length - 2].close : last.open;
        const change = +(last.close - prevClose).toFixed(2);
        const changePct = prevClose ? +((change / prevClose) * 100).toFixed(2) : 0;
        setPrice({
          current: last.close,
          change,
          changePct,
          high: Math.max(...enrichedData.map(d => d.high)),
          low: Math.min(...enrichedData.map(d => d.low)),
          open: enrichedData[0]?.open || 0,
          prevClose,
        });
      }

      if (candlestickSeriesRef.current) {
        candlestickSeriesRef.current.setData(klineData);
        volumeSeriesRef.current?.setData(volumeData);
        chartApiRef.current?.timeScale().fitContent();
      }
    } catch (e) {
      console.error('Chart data error:', e);
      klineByTimeRef.current = new Map();
      candlestickSeriesRef.current?.setData([]);
      volumeSeriesRef.current?.setData([]);
    } finally {
      setLoading(false);
    }
  }, [stockCode, market, range, hideTooltip]);

  useEffect(() => {
    if (!chartRef.current) return undefined;

    let chart;
    let resizeObserver;
    let cancelled = false;

    const initChart = async () => {
      const { createChart, CandlestickSeries, HistogramSeries, CrosshairMode, LineStyle } = await import('lightweight-charts');

      if (cancelled || !chartRef.current) return;

      if (chartApiRef.current) {
        chartApiRef.current.remove();
      }

      chart = createChart(chartRef.current, {
        width: chartRef.current.clientWidth,
        height: CHART_HEIGHT,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#86868b',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: '#8e8e93', width: 1, style: LineStyle.Dashed, visible: true, labelVisible: true },
          horzLine: { color: '#8e8e93', width: 1, style: LineStyle.Dashed, visible: true, labelVisible: true },
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
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: UP_COLOR,
        downColor: DOWN_COLOR,
        borderUpColor: UP_COLOR,
        borderDownColor: DOWN_COLOR,
        wickUpColor: UP_COLOR,
        wickDownColor: DOWN_COLOR,
        priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      });

      // Volume series below candles
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      chart.subscribeCrosshairMove(param => {
        const tooltip = tooltipRef.current;
        const container = chartRef.current;

        if (!tooltip || !container || !param?.point || !param.time) {
          hideTooltip();
          return;
        }

        const { x, y } = param.point;
        if (x < 0 || y < 0 || x > container.clientWidth || y > CHART_HEIGHT) {
          hideTooltip();
          return;
        }

        const candle = param.seriesData?.get(candlestickSeries);
        const source = candle || klineByTimeRef.current.get(timeKey(param.time));
        if (!source) {
          hideTooltip();
          return;
        }

        const stored = klineByTimeRef.current.get(timeKey(source.time ?? param.time));
        const item = stored || source;
        const changePct = Number.isFinite(item.changePct)
          ? item.changePct
          : item.prevClose
            ? ((item.close - item.prevClose) / item.prevClose) * 100
            : 0;
        const isCandleUp = Number(item.close) >= Number(item.open);
        const colorClass = isCandleUp ? 'text-[#e53935]' : 'text-[#43a047]';
        const changeSign = changePct >= 0 ? '+' : '';

        tooltip.innerHTML = `
          <div class="mb-1 font-semibold text-[#1d1d1f]">${formatDate(item.time ?? param.time)}</div>
          <div class="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5">
            <span class="text-[#86868b]">开盘</span><span>${formatPrice(item.open)}</span>
            <span class="text-[#86868b]">最高</span><span>${formatPrice(item.high)}</span>
            <span class="text-[#86868b]">最低</span><span>${formatPrice(item.low)}</span>
            <span class="text-[#86868b]">收盘</span><span class="${colorClass}">${formatPrice(item.close)}</span>
            <span class="text-[#86868b]">成交量</span><span>${formatVolume(item.volume)}</span>
            <span class="text-[#86868b]">涨跌幅</span><span class="${colorClass}">${changeSign}${changePct.toFixed(2)}%</span>
          </div>
        `;

        const tooltipWidth = tooltip.offsetWidth || 150;
        const tooltipHeight = tooltip.offsetHeight || 150;
        const margin = 12;
        let left = x + margin;
        let top = y + margin;

        if (left + tooltipWidth > container.clientWidth) {
          left = x - tooltipWidth - margin;
        }
        if (top + tooltipHeight > CHART_HEIGHT) {
          top = y - tooltipHeight - margin;
        }

        tooltip.style.left = `${Math.max(margin, left)}px`;
        tooltip.style.top = `${Math.max(margin, top)}px`;
        tooltip.style.display = 'block';
      });

      candlestickSeriesRef.current = candlestickSeries;
      volumeSeriesRef.current = volumeSeries;
      chartApiRef.current = chart;

      fetchData();

      resizeObserver = new ResizeObserver(entries => {
        const width = entries[0]?.contentRect?.width || chartRef.current?.clientWidth;
        if (width) {
          chart.applyOptions({ width, height: CHART_HEIGHT });
        }
      });
      resizeObserver.observe(chartRef.current);
    };

    initChart();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      hideTooltip();
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
      if (chart) {
        chart.remove();
      }
      if (chartApiRef.current === chart) {
        chartApiRef.current = null;
      }
    };
  }, [stockCode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (chartApiRef.current) {
      chartApiRef.current.applyOptions({
        timeScale: {
          timeVisible: range === '1D',
          secondsVisible: false,
        },
      });
      fetchData();
    }
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
      <div ref={chartRef} className="relative w-full" style={{ minHeight: CHART_HEIGHT }}>
        {loading && <div className="shimmer absolute inset-0 z-10 w-full h-[420px] rounded-lg" />}
        <div
          ref={tooltipRef}
          className="pointer-events-none absolute z-20 hidden rounded-lg border border-[#e5e5e7] bg-white/95 px-3 py-2 text-xs leading-5 text-[#1d1d1f] shadow-lg backdrop-blur"
          style={{ minWidth: 150 }}
        />
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
