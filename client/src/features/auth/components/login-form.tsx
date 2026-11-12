import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "../hooks/use-auth";
import { BrandMark } from "@/components/common/brand-mark";

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
      <div className="mb-8">
        <BrandMark />
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
          Sign in to see this month's net worth.
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
              placeholder="you@example.com"
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

        {/* submit */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 text-sm font-medium group"
        >
          {loading ? "Signing in…" : "Sign in"}
          <ArrowRight className="size-4 ml-1 transition-transform group-hover:translate-x-0.5" />
        </Button>

      </form>

    </div>
  );
}
