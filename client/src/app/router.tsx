import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/layouts/app-layout";
import { NotFound } from "@/layouts/not-found";
import { LoginPage } from "@/features/auth/pages/login-page";
import { SignupPage } from "@/features/auth/pages/signup-page";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { HomePage } from "@/features/home/pages/home-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
]);
