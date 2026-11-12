import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/layouts/app-layout";
import { NotFound } from "@/layouts/not-found";
import { LoginPage } from "@/features/auth/pages/login-page";
import { SignupPage } from "@/features/auth/pages/signup-page";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { HomePage } from "@/features/home/pages/home-page";
import { UpdatePage } from "@/features/update/pages/update-page";
import { AccountsPage } from "@/features/accounts/pages/accounts-page";
import { PossessionsPage } from "@/features/possessions/pages/possessions-page";
import { ProfilePage } from "@/features/profile/pages/profile-page";

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
      { path: "update", element: <UpdatePage /> },
      { path: "accounts", element: <AccountsPage /> },
      { path: "possessions", element: <PossessionsPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
]);
