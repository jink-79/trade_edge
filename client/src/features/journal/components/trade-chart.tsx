import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { Loader2 } from "lucide-react";
import { useTradeChart } from "../hooks/use-journal";

const GREEN = "#34d399";
const RED = "#f87171";

function toBusinessDay(iso: string): UTCTimestamp {
  return (new Date(iso).getTime() / 1000) as UTCTimestamp;
}

export function TradeChart({ id }: { id: string }) {
  const { data, isLoading, isError } = useTradeChart(id);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // The container div below is ALWAYS mounted (loading/error/empty states are
  // absolutely-positioned overlays on top of it, not alternate returns) —
  // this effect has an empty dep array and only ever runs once on mount, so
  // if the div were conditionally rendered based on isLoading, the effect
  // would fire while containerRef.current was still null and the chart would
  // never get created once the data actually arrived.
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "oklch(0.72 0.02 260)",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "oklch(0.32 0.02 260 / 0.4)" },
        horzLines: { color: "oklch(0.32 0.02 260 / 0.4)" },
      },
      rightPriceScale: { borderColor: "oklch(0.32 0.02 260 / 0.6)" },
      timeScale: {
        borderColor: "oklch(0.32 0.02 260 / 0.6)",
        timeVisible: false,
      },
      crosshair: { mode: 0 },
      autoSize: true,
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: GREEN,
      downColor: RED,
      borderVisible: false,
      wickUpColor: GREEN,
      wickDownColor: RED,
    });
    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Push data + entry/exit markers whenever the fetched chart data changes.
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !data || data.candles.length === 0) return;

    series.setData(
      data.candles.map((c) => ({
        time: toBusinessDay(c.date),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );

    const markers = [
      {
        time: toBusinessDay(data.entryDate),
        position: "belowBar" as const,
        color: GREEN,
        shape: "arrowUp" as const,
        text: `Entry ₹${data.entryPrice}`,
      },
      ...(data.exitDate && data.exitPrice != null
        ? [
            {
              time: toBusinessDay(data.exitDate),
              position: "aboveBar" as const,
              color: RED,
              shape: "arrowDown" as const,
              text: `Exit ₹${data.exitPrice}`,
            },
          ]
        : []),
    ];
    createSeriesMarkers(series, markers);

    series.createPriceLine({
      price: data.entryPrice,
      color: GREEN,
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "Entry",
    });
    if (data.exitPrice != null) {
      series.createPriceLine({
        price: data.exitPrice,
        color: RED,
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "Exit",
      });
    }

    chartRef.current?.timeScale().fitContent();
  }, [data]);

  const showEmpty = !isLoading && (isError || !data || data.candles.length === 0);

  return (
    <div className="relative h-[360px] w-full">
      <div ref={containerRef} className="h-full w-full" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground bg-card/70">
          <Loader2 className="size-4 animate-spin" /> Loading chart…
        </div>
      )}
      {showEmpty && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground bg-card/70">
          No chart data — phalanx-live may not track {data?.symbol ?? "this symbol"}.
        </div>
      )}
    </div>
  );
}
