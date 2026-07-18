import { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { Candle } from '../types';

// See ROADMAP.md step 7 -- do this last. Test with a hardcoded fake
// `candles` array before wiring it to the live WebSocket data, so you're
// only debugging the charting library at first, not two things at once.
//
// lightweight-charts docs: https://tradingview.github.io/lightweight-charts/

const SMA_PERIOD = 10;

interface Props {
  candles: Candle[];
}

interface ChartSeries {
  candleSeries: ISeriesApi<'Candlestick'>;
  volumeSeries: ISeriesApi<'Histogram'>;
  smaSeries: ISeriesApi<'Line'>;
}

function toChartTime(msTimestamp: number): UTCTimestamp {
  // lightweight-charts wants Unix seconds, not milliseconds.
  return Math.floor(msTimestamp / 1000) as UTCTimestamp;
}

//for each index i from (period - 1) to the end, average the
// `close` of the last `period` candles ending at i, and push
// { time: toChartTime(candles[i].time), value: <that average> }.
// Return the resulting array. (There's no SMA point for the first
// `period - 1` candles -- not enough data yet.)
function computeSMA(candles: Candle[], period: number) {

  let total = 0;
  let left = 0;
  let right = 0;
  let avgs = [];
  while (right < period - 1) {
    total += candles[right].close;
    right += 1;
  }
  while (right < candles.length) {
    total += candles[right].close;
    let rec = { time: toChartTime(candles[right].time), value: total / period }
    avgs.push(rec);
    right += 1;
    total -= candles[left].close;
    left += 1;
  }
  return avgs;

}

export default function CandlestickChart({ candles }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ChartSeries | null>(null);

  // Effect #1: create the chart ONCE on mount, tear it down on unmount.
  // This should NOT re-run when `candles` changes 
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chartOptions = {
      layout: { textColor: '#f9f9f9', background: { type: ColorType.Solid, color: '#ffffff00' } },
      grid: { vertLines: { visible: true, color: '#1d1d85' }, horzLines: { visible: true, color: '#1d1d85' } },
      rightPriceScale: { borderColor: '#5b5bd0' },
      timeScale: { borderColor: '#5b5bd0' },
      autoSize: true,

    };
    const chart = createChart(container, chartOptions)

    const candleSeries = chart.addSeries(CandlestickSeries,
      {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350'
      });
    const volumeSeries = chart.addSeries(HistogramSeries,
      {
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume'
      });
    const smaSeries = chart.addSeries(LineSeries, { color: '#2962FF' });

    candleSeries.priceScale().applyOptions({ scaleMargins: { top: 0.1, bottom: 0.4 } });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    chartRef.current = chart;
    seriesRef.current = {
      candleSeries: candleSeries,
      volumeSeries: volumeSeries,
      smaSeries: smaSeries,
    }

    return () => chart.remove();
  }, []);

  // Effect #2: push new candle data in whenever `candles` changes.
  useEffect(() => {
    if (!candles || candles.length === 0 || !seriesRef.current) return;

    const candleArr = candles.map((c) => {
      const record = {
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        time: toChartTime(c.time),
      };
      return record;
    });
    seriesRef.current.candleSeries.setData(candleArr)

    const volumeArr = candles.map((c) => {
      let color;
      if (c.close >= c.open) {
        color = '#21a37c'
      } else {
        color = '#d32525'
      }
      const record = {
        value: c.volume,
        time: toChartTime(c.time),
        color: color
      };
      return record;
    });
    seriesRef.current.volumeSeries.setData(volumeArr);

    if (candles.length >= SMA_PERIOD) {
      seriesRef.current.smaSeries.setData(computeSMA(candles, SMA_PERIOD))
    }
  }, [candles]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
