import { Link } from "react-router-dom";
import { BrandPanel } from "../components/brand-panel";
import { LoginForm } from "../components/login-form";

export function LoginPage() {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      <BrandPanel />

      <main className="relative flex flex-col items-center justify-center px-6 py-12 sm:px-12">
        <div className="absolute top-6 right-6 text-xs text-muted-foreground">
          New here?{" "}
          <Link
            to="/signup"
            className="text-foreground hover:text-primary transition-colors"
          >
            Create an account
          </Link>
        </div>

        <LoginForm />
      </main>
    </div>
  );
}
