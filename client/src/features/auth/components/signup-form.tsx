import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "../hooks/use-auth";

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string,
): FormErrors {
  const errors: FormErrors = {};
  if (fullName.trim().length < 2) errors.fullName = "Enter your full name";
  if (!email.trim()) errors.email = "Email is required";
  else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Enter a valid email";
  if (!password) errors.password = "Password is required";
  else if (password.length < 8) errors.password = "At least 8 characters";
  if (confirmPassword !== password)
    errors.confirmPassword = "Passwords do not match";
  return errors;
}

export function SignupForm() {
  const { register, loading } = useRegister();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const clearError = (field: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(fullName, email, password, confirmPassword);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    await register({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
    });
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
          Create your account
        </h2>
        <p className="text-sm text-muted-foreground">
          Start tracking your edge in a few seconds.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        {/* full name */}
        <div className="space-y-2">
          <Label
            htmlFor="fullName"
            className="text-xs uppercase tracking-[0.14em] text-muted-foreground"
          >
            Full name
          </Label>
          <div className="relative">
            <User className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Jane Trader"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearError("fullName");
              }}
              className={`pl-9 h-11 bg-card/60 ${errors.fullName ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
            />
          </div>
          {errors.fullName && (
            <p className="text-[11px] text-destructive">{errors.fullName}</p>
          )}
        </div>

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
          <Label
            htmlFor="password"
            className="text-xs uppercase tracking-[0.14em] text-muted-foreground"
          >
            Password
          </Label>
          <div className="relative">
            <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
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

        {/* confirm password */}
        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-xs uppercase tracking-[0.14em] text-muted-foreground"
          >
            Confirm password
          </Label>
          <div className="relative">
            <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearError("confirmPassword");
              }}
              className={`pl-9 h-11 bg-card/60 ${errors.confirmPassword ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-[11px] text-destructive">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* submit */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 text-sm font-medium group"
        >
          {loading ? "Creating account…" : "Create account"}
          <ArrowRight className="size-4 ml-1 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </form>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-foreground/80 hover:text-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
