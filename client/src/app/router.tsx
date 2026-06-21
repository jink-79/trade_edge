import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/layouts/app-layout";
import { Dashboard } from "@/features/dashboard/pages/dash-borad";
import { NotFound } from "@/layouts/not-found";
import { SignalsPage } from "@/features/signals/pages/signals";
import { FundsPage } from "@/features/funds/pages/funds-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { path: "*", element: <NotFound /> },
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "signals",
        element: <SignalsPage />,
      },
      {
        path: "funds",
        element: <FundsPage />,
      },
    ],
  },
]);
