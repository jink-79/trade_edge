import { LoginForm } from "../components/login-form";

export function LoginPage() {
  return (
    <div className="min-h-dvh w-full bg-background">
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 pt-[calc(env(safe-area-inset-top)+3rem)] pb-[calc(env(safe-area-inset-bottom)+3rem)] sm:px-12">
        <LoginForm />
      </main>
    </div>
  );
}
