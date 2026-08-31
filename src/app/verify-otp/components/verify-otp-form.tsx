"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  isOTPValid,
  isPasswordValid,
  passwordRequirements,
} from "@/lib/validation";
import { Loader2, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function VerifyOTPForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  const mode = searchParams.get("mode") || "signup";

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(600);
  const [isResending, setIsResending] = useState(false);
  const [touched, setTouched] = useState({ password: false });

  const passwordChecks = passwordRequirements.map((req) => ({
    ...req,
    isValid: req.validate(newPassword),
  }));
  const allValid = isPasswordValid(newPassword);
  const passwordErrors =
    touched.password && newPassword && !allValid
      ? "Please meet all password requirements"
      : "";

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!isOTPValid(otp)) {
      setError("Please enter a valid 6-digit verification code");
      setIsLoading(false);
      return;
    }

    if (mode === "reset") {
      if (!allValid) {
        setError("Please meet all password requirements");
        setIsLoading(false);
        return;
      }
    }

    try {
      const payload: any = {
        email,
        otp,
        step: "verify-otp",
        mode,
      };
      if (mode === "reset") {
        payload.newPassword = newPassword;
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          if (data.error?.toLowerCase().includes("expired")) {
            setError(
              "The verification code has expired. Please request a new one.",
            );
          } else if (data.error?.toLowerCase().includes("invalid")) {
            setError("Invalid verification code. Please check and try again.");
          } else {
            setError(data.error || "Verification failed. Please try again.");
          }
        } else {
          setError("Unable to verify your code. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setSuccessMessage(
        mode === "reset"
          ? "Your password has been reset successfully!"
          : "Your account has been verified successfully!",
      );

      setTimeout(() => {
        if (mode === "reset") {
          window.location.href = "/login?reset=true";
        } else {
          window.location.href = "/";
        }
      }, 1500);
    } catch (error) {
      setError(
        "Unable to connect to the server. Please check your internet connection.",
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    if (isResending || timeLeft > 540) return;
    setIsResending(true);
    setError("");

    try {
      const endpoint =
        mode === "reset"
          ? "/api/auth/resend-otp?mode=reset"
          : "/api/auth/resend-otp";
      const response = await fetch(endpoint, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to resend verification code");
        setIsResending(false);
        return;
      }

      setTimeLeft(600);
      setError("New verification code sent to your email!");
    } catch (error) {
      setError("Failed to resend verification code");
      console.error(error);
    } finally {
      setIsResending(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="rounded-full bg-green-100 p-3 w-16 h-16 mx-auto flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">
          {mode === "reset" ? "Password Reset!" : "Email Verified!"}
        </h3>
        <p className="text-sm text-muted-foreground mt-2">{successMessage}</p>
        <p className="text-xs text-muted-foreground mt-1">Redirecting...</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={mode === "reset" ? "/forgot-password" : "/register"}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {mode === "reset" ? "Back to Reset Password" : "Back to Register"}
        </Link>
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "reset" ? "Reset Password" : "Verify Email"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit verification code sent to{" "}
          <span className="font-medium">{email}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Code expires in{" "}
          <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp">
            Verification Code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="otp"
            type="text"
            placeholder="123456"
            value={otp}
            onChange={handleOTPChange}
            maxLength={6}
            disabled={isLoading}
            className={otp && !isOTPValid(otp) ? "border-destructive" : ""}
            required
          />
          {otp && !isOTPValid(otp) && (
            <p className="text-sm text-destructive">
              Please enter a valid 6-digit code
            </p>
          )}
        </div>

        {mode === "reset" && (
          <div className="space-y-2">
            <Label htmlFor="new-password">
              New Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="new-password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onBlur={() => setTouched({ ...touched, password: true })}
              disabled={isLoading}
              className={passwordErrors ? "border-destructive" : ""}
              required
            />
            {touched.password && newPassword && (
              <div className="space-y-1.5 rounded-lg bg-muted p-3">
                {passwordChecks.map((check) => (
                  <div
                    key={check.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    {check.isValid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span
                      className={
                        check.isValid
                          ? "text-green-500"
                          : "text-muted-foreground"
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
        )}

        {error && (
          <p
            className={`text-sm ${error.includes("sent") ? "text-green-600" : "text-destructive"}`}
          >
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "reset" ? "Reset Password" : "Verify & Continue"}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || timeLeft > 540}
            className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? (
              <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
            ) : timeLeft > 540 ? (
              `Resend available in ${formatTime(timeLeft - 540)}`
            ) : (
              "Resend Verification Code"
            )}
          </button>
        </div>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "reset" ? (
          <>
            Remember your password?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Back to login
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
