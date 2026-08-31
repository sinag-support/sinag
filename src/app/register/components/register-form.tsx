"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  isEmailValid,
  isPasswordValid,
  passwordRequirements,
} from "@/lib/validation";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  XCircle,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
  });

  const emailError =
    touched.email && formData.email && !isEmailValid(formData.email)
      ? "Please enter a valid email address"
      : "";

  const passwordChecks = passwordRequirements.map((req) => ({
    ...req,
    isValid: req.validate(formData.password),
  }));

  const allValid = isPasswordValid(formData.password);
  const passwordErrors =
    touched.password && formData.password && !allValid
      ? "Please meet all password requirements"
      : "";

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, email: e.target.value });
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter your full name");
      setIsLoading(false);
      return;
    }

    if (!isEmailValid(formData.email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    if (!allValid) {
      setError("Please meet all password requirements");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          step: "send-otp",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          if (data.error?.toLowerCase().includes("already exists")) {
            setError(
              "An account with this email already exists. Please login instead.",
            );
          } else if (data.error?.toLowerCase().includes("invalid email")) {
            setError("Please enter a valid email address.");
          } else {
            setError(
              data.error ||
                "Failed to send verification code. Please try again.",
            );
          }
        } else if (response.status === 429) {
          setError(
            "Too many signup attempts. Please wait a moment and try again.",
          );
        } else {
          setError(
            "Unable to send verification code. Please check your email address and try again.",
          );
        }
        setIsLoading(false);
        return;
      }

      router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      setError(
        "Unable to connect to the server. Please check your internet connection.",
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function signInWithGoogle() {
    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        if (error.message?.toLowerCase().includes("popup")) {
          setError(
            "Popup was blocked. Please allow popups for this site and try again.",
          );
        } else {
          setError(error.message || "Google sign in failed. Please try again.");
        }
        setIsLoading(false);
      }
    } catch (error) {
      setError("Unable to connect to Google. Please try again later.");
      console.error(error);
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Store
        </Link>
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
        <p className="text-sm text-muted-foreground">
          Join SINAG and start shopping with us
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onBlur={() => setTouched({ ...touched, name: true })}
            disabled={isLoading}
            className={
              touched.name && !formData.name.trim() ? "border-destructive" : ""
            }
            required
          />
          {touched.name && !formData.name.trim() && (
            <p className="text-sm text-destructive">Name is required</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={formData.email}
            onChange={handleEmailChange}
            onBlur={() => setTouched({ ...touched, email: true })}
            disabled={isLoading}
            className={emailError ? "border-destructive" : ""}
            required
          />
          {emailError && (
            <p className="text-sm text-destructive">{emailError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            Password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              onBlur={() => setTouched({ ...touched, password: true })}
              disabled={isLoading}
              className={passwordErrors ? "border-destructive" : ""}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {touched.password && formData.password && (
            <div className="space-y-1.5 rounded-lg bg-muted p-3">
              {passwordChecks.map((check) => (
                <div key={check.id} className="flex items-center gap-2 text-sm">
                  {check.isValid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span
                    className={
                      check.isValid ? "text-green-500" : "text-muted-foreground"
                    }
                  >
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          )}
          {passwordErrors && (
            <p className="text-sm text-destructive">{passwordErrors}</p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={signInWithGoogle}
        disabled={isLoading}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
