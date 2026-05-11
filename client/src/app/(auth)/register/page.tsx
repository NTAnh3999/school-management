import Link from "next/link";
import { BookOpenText, PartyPopper, Star } from "lucide-react";

import { RegisterForm } from "../_feature/components/register-form";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 overflow-hidden md:grid-cols-2">
      {/* ── Left: Branding panel ────────────────────────────────── */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 md:flex">
        {/* Decorative ambient blobs */}
        <div className="absolute right-0 top-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary-container/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/3 translate-y-1/3 rounded-full bg-[#68fadd]/10 blur-2xl" />

        {/* Top: Logo + headline */}
        <div className="relative z-10">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <BookOpenText className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-white">SchoolHub</span>
          </div>
          <div className="max-w-md">
            <h2 className="mb-4 text-5xl font-bold leading-tight tracking-tight text-white">
              Unlock your potential with a trusted learning companion.
            </h2>
            <p className="font-reading text-lg leading-relaxed text-white/80">
              Join a community of lifelong learners and experience a
              personalized, minimal, and effective educational journey.
            </p>
          </div>
        </div>

        {/* Bottom: Testimonial card — Level 3 glassmorphism */}
        <div className="relative z-10">
          <div className="max-w-sm rounded-xl border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-md">
            <div className="mb-3 flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 text-gold"
                  style={{ fill: "hsl(var(--gold))" }}
                />
              ))}
            </div>
            <p className="mb-4 font-reading text-sm italic leading-6 text-white">
              "The minimal interface lets me focus entirely on learning without
              distractions. A wonderful experience for busy people."
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/30 bg-white/20 text-sm font-bold text-white">
                H
              </div>
              <div>
                <p className="text-label-caps text-white">Hoang Nguyen</p>
                <p className="text-xs text-white/60">Language Learner</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Right: Registration form ─────────────────────────────── */}
      <section className="flex flex-col items-center justify-center bg-surface px-6 py-12 md:px-10">
        <div className="w-full max-w-[480px]">
          {/* Mobile logo (hidden on desktop since left panel shows it) */}
          <div className="mb-6 flex items-center gap-3 md:hidden">
            <BookOpenText className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">SchoolHub</span>
          </div>

          <div className="mb-7">
            <h3 className="mb-1 text-2xl font-semibold text-foreground">
              Start your journey
            </h3>
            <p className="text-sm text-muted-foreground">
              Create your SchoolHub account to explore the knowledge library
              today.
            </p>
          </div>

          {/* Social sign-up buttons */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2.5 rounded-xl border border-border bg-white px-4 py-3 text-xs font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-surface-low"
            >
              <GoogleIcon />
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2.5 rounded-xl border border-border bg-white px-4 py-3 text-xs font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-surface-low"
            >
              <FacebookIcon />
              Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-surface px-3 text-label-caps text-muted-foreground">
                Or sign up with email
              </span>
            </div>
          </div>

          <RegisterForm />

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Encouragement toast — fixed bottom, matches HTML design */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0">
          <div className="flex items-center gap-3 rounded-full border border-secondary/20 bg-secondary/10 px-5 py-3 shadow-mentor">
            <PartyPopper className="h-4 w-4 text-secondary" />
            <p className="text-label-caps text-secondary">
              Join 50,000+ learners today!
            </p>
          </div>
        </div>
      </section>
    </main>
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

function FacebookIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-[#1877F2]"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
