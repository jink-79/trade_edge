import { Link } from "react-router-dom";
import { LoginForm } from "../components/login-form";

export function LoginPage() {
  return (
    <div className="min-h-dvh w-full bg-background">
      <main className="relative flex min-h-dvh flex-col items-center justify-center px-6 pt-[calc(env(safe-area-inset-top)+4rem)] pb-[calc(env(safe-area-inset-bottom)+3rem)] sm:px-12">
        <div className="absolute top-[calc(env(safe-area-inset-top)+1.5rem)] right-6 text-xs text-muted-foreground">
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
