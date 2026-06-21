import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/layouts/app-layout";
import Dashboard from "@/features/dashboard/pages/dash-borad";
import { NotFound } from "@/layouts/not-found";

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
    ],
  },
]);
