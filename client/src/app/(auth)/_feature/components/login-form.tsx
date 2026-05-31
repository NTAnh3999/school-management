"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail, Trophy } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "../hooks";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    login.mutate(values, {
      onSuccess: () => {
        toast.success("Welcome back!");
        router.push("/dashboard");
      },
      onError: () => {
        toast.error("Unable to login. Please try again.");
      },
    });
  };

  return (
    <>
      <div className="mb-10">
        <h2 className="text-2xl font-semibold text-foreground">Sign in</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Continue your learning journey with a calm, structured workspace.
        </p>
      </div>

      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-outline">
              <Mail className="h-4 w-4" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="example@gmail.com"
              className="pl-12"
              {...form.register("email")}
            />
          </div>
          {form.formState.errors.email ? (
            <p className="pt-1 text-sm text-destructive">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <div
            className="flex items-center justify-between gap-4"
          >
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              tabIndex={-1}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-outline">
              <Lock className="h-4 w-4" />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="pl-12 pr-12"
              {...form.register("password")}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-outline transition-colors hover:text-foreground"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {form.formState.errors.password ? (
            <p className="pt-1 text-sm text-destructive">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="flex items-center">
          <input
            id="remember"
            type="checkbox"
            className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
          />
          <label
            htmlFor="remember"
            className="ml-2 text-sm text-muted-foreground"
          >
            Keep me signed in
          </label>
        </div>

        <Button
          className="w-full border-b-2 border-primary-container"
          type="submit"
          disabled={login.isPending}
        >
          {login.isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="relative my-10">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-outline-variant" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-surface-lowest px-4 text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
            Or sign in with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-variant/20"
        >
          <GoogleIcon />
          Google
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-variant/20"
        >
          <AppleIcon />
          Apple
        </button>
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-bold text-primary hover:underline"
        >
          Create a new account
        </Link>
      </p>

      <div className="mt-10 border-t border-outline-variant/30 pt-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-tertiary-fixed px-4 py-2 text-xs font-bold text-tertiary-foreground shadow-sm">
          <Trophy className="h-4 w-4" />
          Consistent learning is how progress compounds.
        </div>
      </div>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
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
  );
}

function AppleIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16.37 1.43c0 1.14-.42 2.18-1.11 2.92-.77.83-2.03 1.47-3.11 1.38-.14-1.09.4-2.24 1.11-2.97.78-.81 2.11-1.4 3.11-1.33ZM20.85 17.03c-.49 1.12-.73 1.61-1.36 2.58-.88 1.36-2.12 3.06-3.66 3.08-1.37.02-1.72-.89-3.58-.88-1.86.01-2.25.9-3.63.88-1.54-.02-2.71-1.55-3.59-2.91-2.46-3.78-2.72-8.21-1.2-10.55 1.08-1.67 2.79-2.64 4.39-2.64 1.64 0 2.68.9 4.04.9 1.32 0 2.13-.91 4.03-.91 1.43 0 2.95.78 4.02 2.12-3.55 1.95-2.97 7.01.54 8.33Z" />
    </svg>
  );
}
