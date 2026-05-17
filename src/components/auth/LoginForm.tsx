"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedRole, setCopiedRole] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to log in.");
        setIsLoading(false);
        return;
      }

      setSuccess(`Welcome back, ${data.user.name}! Redirecting...`);

      // Redirect based on role or password reset required
      setTimeout(() => {
        if (data.user.passwordResetRequired) {
          window.location.href = "/change-password";
        } else if (data.user.role === "admin") {
          window.location.href = "/admin";
        } else if (data.user.role === "manager") {
          window.location.href = "/manager";
        } else {
          window.location.href = "/employee";
        }
      }, 800);

    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again later.");
      setIsLoading(false);
    }
  };

  const copyToClipboard = (emailToCopy: string, role: string) => {
    navigator.clipboard.writeText(emailToCopy);
    setEmail(emailToCopy);
    setPassword(role.charAt(0).toUpperCase() + role.slice(1) + "@123");
    setCopiedRole(role);
    setTimeout(() => setCopiedRole(null), 2000);
  };

  const demoCredentials = [
    { role: "employee", email: "employee@atomquest.com" },
    { role: "manager", email: "manager@atomquest.com" },
    { role: "admin", email: "admin@atomquest.com" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto space-y-8"
    >
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
        <p className="text-muted-foreground text-sm">
          Enter your credentials to access your dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
              disabled={isLoading || !!success}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a href="#" className="text-sm text-primary hover:underline font-medium">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 pr-10"
                disabled={isLoading || !!success}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-md border border-destructive/20"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-sm text-green-700 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-200 dark:border-green-800 flex items-center gap-2"
          >
            <CheckCircle2 className="size-4" />
            {success}
          </motion.div>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox id="remember" />
          <Label htmlFor="remember" className="text-sm font-normal">
            Remember me for 30 days
          </Label>
        </div>

        <Button type="submit" className="w-full h-11" disabled={isLoading || !!success}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      {/* Demo Credentials Section */}
      <div className="mt-8 pt-8 border-t">
        <h4 className="text-sm font-medium text-muted-foreground mb-4 text-center">
          Demo Credentials
        </h4>
        <div className="space-y-3">
          {demoCredentials.map((cred) => (
            <div key={cred.role} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
              <div>
                <p className="text-sm font-medium capitalize">{cred.role}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{cred.email}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyToClipboard(cred.email, cred.role)}
                className="h-8 gap-2"
              >
                {copiedRole === cred.role ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 text-muted-foreground" />
                    Fill Form
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
