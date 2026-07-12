"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { Truck, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-elements";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initialize = useAuthStore((s) => s.initialize);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 600));

    if (!email) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    const success = await login(email, password);
    if (success) {
      router.push("/dashboard");
    } else {
      setError("Invalid credentials. Try a demo account.");
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
            FLEET COMMAND CENTER
          </p>
        </div>

        {/* Login form */}
        <div className="bg-card border border-border rounded-sm p-6 animate-stagger-in" style={{ animationDelay: "100ms" }}>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm p-2 bg-destructive/10 rounded-sm" role="alert">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Sign In
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary hover:underline font-semibold"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
