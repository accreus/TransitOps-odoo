"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Truck, Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form-elements";
import type { UserRole } from "@/types";

const roleOptions = [
  { value: "fleet_manager", label: "Fleet Manager" },
  { value: "driver", label: "Driver" },
  { value: "safety_officer", label: "Safety Officer" },
  { value: "financial_analyst", label: "Financial Analyst" },
];

export default function SignupPage() {
  const router = useRouter();
  const signup = useAuthStore((s) => s.signup);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("fleet_manager");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }

    if (!email) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const result = await signup(name.trim(), email, password, role);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Signup failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo & branding */}
        <div className="text-center mb-8 animate-stagger-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm bg-primary/10 border border-primary/30 mb-4">
            <Truck className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
            TransitOps
          </h1>
          <p className="mt-1 text-sm text-muted-foreground font-mono">
            CREATE YOUR ACCOUNT
          </p>
        </div>

        {/* Signup form */}
        <div className="bg-card border border-border rounded-sm p-6 animate-stagger-in" style={{ animationDelay: "100ms" }}>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Full Name"
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="operator@transitops.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              spellCheck={false}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[2.1rem] p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              options={roleOptions}
              required
            />

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm p-2 bg-destructive/10 rounded-sm" role="alert">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Create Account
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-semibold"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Info note */}
        <div className="mt-6 animate-stagger-in" style={{ animationDelay: "200ms" }}>
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-card border border-border rounded-sm p-3">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-primary" aria-hidden="true" />
            <p>
              After signing up, you may need to confirm your email before logging in.
              If email confirmation is disabled, you can log in immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
