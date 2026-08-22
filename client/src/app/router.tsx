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
import { PreferencesPage } from "@/features/preferences/pages/preferences-page";
import { TradeDetailPage } from "@/features/journal/pages/trade-detail-page";
import { AlgoSignalsPage } from "@/features/algo-signals/pages/algo-signals-page";
import { CalendarPage } from "@/features/calendar/pages/calendar-page";
import { MissedSignalsPage } from "@/features/missed-signals/pages/missed-signals-page";

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
        path: "algo-signals",
        element: <AlgoSignalsPage />,
      },
      {
        path: "calendar",
        element: <CalendarPage />,
      },
      {
        path: "missed-signals",
        element: <MissedSignalsPage />,
      },
      {
        path: "trades/:id",
        element: <TradeDetailPage />,
      },
      {
        path: "overview",
        element: <OverviewPage />,
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
