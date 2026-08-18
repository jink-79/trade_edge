import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/layouts/app-layout";
import { Dashboard } from "@/features/dashboard/pages/dash-borad";
import { NotFound } from "@/layouts/not-found";
import { FundsPage } from "@/features/funds/pages/funds-page";
import { LoginPage } from "@/features/auth/pages/login-page";
import { SignupPage } from "@/features/auth/pages/signup-page";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { MutualFundsPage } from "@/features/mutual-funds/pages/mutual-funds";
import { AnalyticsPage } from "@/features/analytics/pages/analytics-page";
import { PositionsPage } from "@/features/positions/pages/positions-page";
import { HistoryPage } from "@/features/history/pages/history";
import { OverviewPage } from "@/features/overview/pages/overview";
import { PlaybookPage } from "@/features/playbook/pages/playbook";
import { PreferencesPage } from "@/features/preferences/pages/preferences-page";
import { TradeDetailPage } from "@/features/journal/pages/trade-detail-page";
import { TradeNotesPage } from "@/features/journal/pages/trade-notes-page";
import { MetricsGraphsPage } from "@/features/backtest-report/pages/metrics-graphs-page";
import { BlotterPage } from "@/features/backtest-report/pages/blotter-page";
import { StockPerformancePage } from "@/features/backtest-report/pages/stock-performance-page";
import { StockDetailPage } from "@/features/backtest-report/pages/stock-detail-page";
import { DocumentationPage } from "@/features/backtest-report/pages/documentation-page";
import { UploadPage } from "@/features/backtest-report/pages/upload-page";
import { ScannerPage } from "@/features/scanner/pages/scanner-page";
import { PerformancePage } from "@/features/performance/pages/performance-page";
import { PulsePage } from "@/features/pulse/pages/pulse-page";
import { AlgoSignalsPage } from "@/features/algo-signals/pages/algo-signals-page";
import { DailyPnlPage } from "@/features/daily-pnl/pages/daily-pnl-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "*", element: <NotFound /> },
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "funds",
        element: <FundsPage />,
      },
      {
        path: "mutual-funds",
        element: <MutualFundsPage />,
      },
      {
        path: "analytics",
        element: <AnalyticsPage />,
      },
      {
        path: "positions",
        element: <PositionsPage />,
      },
      {
        path: "history",
        element: <HistoryPage />,
      },
      {
        path: "scanner",
        element: <ScannerPage />,
      },
      {
        path: "performance",
        element: <PerformancePage />,
      },
      {
        path: "pulse",
        element: <PulsePage />,
      },
      {
        path: "algo-signals",
        element: <AlgoSignalsPage />,
      },
      {
        path: "daily-pnl",
        element: <DailyPnlPage />,
      },
      {
        path: "trades/:id",
        element: <TradeDetailPage />,
      },
      {
        path: "journal/notes",
        element: <TradeNotesPage />,
      },
      {
        path: "report/metrics",
        element: <MetricsGraphsPage />,
      },
      {
        path: "report/blotter",
        element: <BlotterPage />,
      },
      {
        path: "report/stocks",
        element: <StockPerformancePage />,
      },
      {
        path: "report/stocks/:symbol",
        element: <StockDetailPage />,
      },
      {
        path: "report/docs",
        element: <DocumentationPage />,
      },
      {
        path: "report/upload",
        element: <UploadPage />,
      },
      {
        path: "overview",
        element: <OverviewPage />,
      },
      {
        path: "playbook",
        element: <PlaybookPage />,
      },
      {
        path: "preferences",
        element: <PreferencesPage />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
]);
