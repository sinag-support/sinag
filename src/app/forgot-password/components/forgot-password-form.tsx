"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isEmailValid } from "@/lib/validation";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !isEmailValid(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!isEmailValid(email)) {
      setEmailError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setError(
            "No account found with this email address. Please check and try again.",
          );
        } else if (response.status === 429) {
          setError(
            "Too many password reset attempts. Please wait a moment and try again.",
          );
        } else {
          setError(
            data.error || "Failed to send reset code. Please try again.",
          );
        }
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(
          `/verify-otp?email=${encodeURIComponent(email)}&mode=reset`,
        );
      }, 1000);
    } catch (error) {
      setError(
        "Unable to connect to the server. Please check your internet connection.",
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Link>
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Forgot Password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we'll send you a code to reset your
          password.
        </p>
      </div>

      {success ? (
        <div className="text-center space-y-2">
          <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
          <p className="text-green-600 font-medium">
            Reset code sent to your email!
          </p>
          <p className="text-sm text-muted-foreground">
            Please check your inbox and enter the code on the next page.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={handleEmailChange}
              disabled={isLoading}
              className={
                emailError
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
              required
            />
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Code
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
