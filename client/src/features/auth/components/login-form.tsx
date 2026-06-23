import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useLogin } from "../hooks/use-auth";

interface FormErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (!email.trim()) errors.email = "Email is required";
  else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Enter a valid email";
  if (!password) errors.password = "Password is required";
  else if (password.length < 6) errors.password = "At least 6 characters";
  return errors;
}

export function LoginForm() {
  const { login, loading } = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});

  const clearError = (field: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(email, password);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    await login({ email: email.trim().toLowerCase(), password });
  };

  return (
    <div className="w-full max-w-sm">
      {/* mobile logo */}
      <div className="lg:hidden flex items-center gap-2.5 mb-8">
        <div className="size-9 rounded-lg grid place-items-center bg-primary/15 ring-1 ring-primary/30">
          <span className="text-primary text-sm font-bold">TE</span>
        </div>
        <div
          className="text-base font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Trade Edge
        </div>
      </div>

      {/* heading */}
      <div className="space-y-2">
        <h2
          className="text-3xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Welcome back
        </h2>
        <p className="text-sm text-muted-foreground">
          Sign in to review your edge and log today's trades.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        {/* email */}
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-xs uppercase tracking-[0.14em] text-muted-foreground"
          >
            Email
          </Label>
          <div className="relative">
            <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@tradedesk.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("email");
              }}
              className={`pl-9 h-11 bg-card/60 ${errors.email ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-destructive">{errors.email}</p>
          )}
        </div>

        {/* password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-xs uppercase tracking-[0.14em] text-muted-foreground"
            >
              Password
            </Label>
            <button
              type="button"
              onClick={() => toast.info("Password reset coming soon.")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot?
            </button>
          </div>
          <div className="relative">
            <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
              className={`pl-9 pr-10 h-11 bg-card/60 ${errors.password ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-destructive">{errors.password}</p>
          )}
        </div>

        {/* remember me */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Checkbox
              checked={remember}
              onCheckedChange={(v) => setRemember(Boolean(v))}
            />
            Keep me signed in
          </label>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="size-3 text-primary" />
            Encrypted
          </div>
        </div>

        {/* submit */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 text-sm font-medium group"
        >
          {loading ? "Signing in…" : "Sign in to Trade Edge"}
          <ArrowRight className="size-4 ml-1 transition-transform group-hover:translate-x-0.5" />
        </Button>

        {/* divider */}
        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 -translate-x-1/2 -top-2 px-2 bg-background text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            or continue with
          </span>
        </div>

        {/* social buttons — wired up when backend supports OAuth */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 bg-card/40"
            onClick={() => toast.info("Google sign-in coming soon.")}
          >
            <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.07-1.1-.16-1.6H12z"
              />
            </svg>
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 bg-card/40"
            onClick={() => toast.info("Apple sign-in coming soon.")}
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M16.4 12.6c0-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-2-.9-3.3-.8-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.3 2.5 1.3-.05 1.8-.85 3.4-.85s2 .85 3.4.82c1.4-.02 2.3-1.2 3.2-2.5.7-1 1.2-2 1.5-3.1-.04-.02-2.5-.95-2.5-3.99zM14 5.2c.7-.85 1.2-2 1.05-3.2-1 .04-2.3.7-3 1.55-.65.75-1.25 1.95-1.1 3.1 1.15.1 2.3-.6 3.05-1.45z" />
            </svg>
            Apple
          </Button>
        </div>
      </form>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        By signing in you agree to our{" "}
        <a className="text-foreground/80 hover:text-primary cursor-pointer">
          Terms
        </a>{" "}
        &{" "}
        <a className="text-foreground/80 hover:text-primary cursor-pointer">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
