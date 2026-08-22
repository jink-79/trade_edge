import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  LineSeries,
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
const RS_LINE = "#818cf8";

function toBusinessDay(iso: string): UTCTimestamp {
  return (new Date(iso).getTime() / 1000) as UTCTimestamp;
}

export function TradeChart({ id }: { id: string }) {
  const { data, isLoading, isError } = useTradeChart(id);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const rsSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

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
        textColor: "#9199ab",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(145,153,171,0.12)" },
        horzLines: { color: "rgba(145,153,171,0.12)" },
      },
      rightPriceScale: { borderColor: "rgba(145,153,171,0.25)" },
      timeScale: {
        borderColor: "rgba(145,153,171,0.25)",
        timeVisible: false,
        // Leaves empty space to the right of the last candle instead of
        // gluing it to the edge of the chart.
        rightOffset: 10,
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
    const rsSeries = chart.addSeries(
      LineSeries,
      {
        color: RS_LINE,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
      },
      1,
    );
    chart.panes()[1]?.setHeight(window.innerWidth < 640 ? 70 : 110);

    chartRef.current = chart;
    seriesRef.current = series;
    rsSeriesRef.current = rsSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      rsSeriesRef.current = null;
    };
  }, []);

  // Push data + entry/exit markers whenever the fetched chart data changes.
  useEffect(() => {
    const series = seriesRef.current;
    const rsSeries = rsSeriesRef.current;
    if (!series || !rsSeries || !data || data.candles.length === 0) return;

    series.setData(
      data.candles.map((c) => ({
        time: toBusinessDay(c.date),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );

    rsSeries.setData(
      data.candles
        .map((c, i) => ({ time: toBusinessDay(c.date), value: data.rsSeries[i] }))
        .filter((p): p is { time: UTCTimestamp; value: number } => p.value != null),
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

    // Dashed reference lines only — no axis-label title, since the marker
    // above/below the candle already names the price.
    series.createPriceLine({
      price: data.entryPrice,
      color: GREEN,
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: false,
    });
    if (data.exitPrice != null) {
      series.createPriceLine({
        price: data.exitPrice,
        color: RED,
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: false,
      });
    }

    chartRef.current?.timeScale().fitContent();
  }, [data]);

  const showEmpty = !isLoading && (isError || !data || data.candles.length === 0);

  return (
    <div className="relative h-[300px] sm:h-[380px] lg:h-[480px] w-full overflow-hidden">
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
