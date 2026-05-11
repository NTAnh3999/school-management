import Link from "next/link";
import { ArrowLeft, BookOpenText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotPasswordForm } from "../_feature/components/forgot-pasword-form";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-6">
      <div className="w-full max-w-[480px]">
        {/* Brand header */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <BookOpenText className="h-6 w-6" />
          </div>
          <span className="text-xl font-semibold text-foreground">
            SchoolHub
          </span>
        </div>

        <Card className="surface-elevated overflow-hidden rounded-[2rem] border-white/80">
          <CardHeader className="space-y-2 border-b border-white/70 pb-5">
            <CardTitle className="text-2xl">Forgot your password?</CardTitle>
            <p className="font-reading text-sm leading-7 text-muted-foreground">
              No worries. Enter your registered email and we'll send you a reset
              link.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <ForgotPasswordForm />
          </CardContent>
        </Card>

        {/* Back to login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline underline-offset-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign in
          </Link>
        </div>

        {/* Support footer */}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Need help?{" "}
          <a
            href="mailto:support@schoolhub.io"
            className="font-semibold text-secondary hover:underline"
          >
            Contact support
          </a>
        </p>
      </div>
    </main>
  );
}
