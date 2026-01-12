"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);

  // Check for email confirmation success
  useEffect(() => {
    if (searchParams.get('confirmed') === 'true') {
      setSuccess(t("emailConfirmed"));
    }
    const errorType = searchParams.get('error');
    const errorMessage = searchParams.get('message');
    if (errorType) {
      if (errorType === 'callback_error') {
        setError(errorMessage || t("authError"));
        setShowResendOption(true);
      } else if (errorType === 'verification_failed') {
        setError(t("verificationFailed") || "Email verification failed. Please try again.");
        setShowResendOption(true);
      } else if (errorType === 'no_code') {
        setError(t("invalidLink") || "Invalid or expired link. Please request a new one.");
        setShowResendOption(true);
      } else {
        setError(t("authError"));
      }
    }
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setShowResendOption(false);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("invalidCredentials"));
        // Show resend option if login fails - user might not have confirmed email
        if (email) {
          setShowResendOption(true);
        }
      } else {
        router.push(`/${locale}`);
        router.refresh();
      }
    } catch {
      setError(t("invalidCredentials"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError(t("emailRequired") || "Please enter your email address first.");
      return;
    }

    setIsResending(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(t("confirmationResent") || "If an account exists with this email, a confirmation link has been sent.");
        setShowResendOption(false);
      } else {
        setError(data.error || t("authError"));
      }
    } catch {
      setError(t("authError"));
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: `/${locale}` });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("login")}</CardTitle>
        <CardDescription>{t("loginWithGoogle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {success && (
            <div className="p-3 text-sm text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-md">
              {success}
            </div>
          )}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
              </>
            ) : (
              t("login")
            )}
          </Button>

          {showResendOption && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={handleResendConfirmation}
              disabled={isResending}
            >
              {isResending ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : (
                <Mail className="h-4 w-4 me-2" />
              )}
              {t("resendConfirmation") || "Resend confirmation email"}
            </Button>
          )}
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          {t("loginWithGoogle")}
        </Button>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link
            href={`/${locale}/auth/register`}
            className="text-primary hover:underline"
          >
            {t("register")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
