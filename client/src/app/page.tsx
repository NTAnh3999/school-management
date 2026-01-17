import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/features/auth/components/login-form";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/50">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-20 lg:grid-cols-2">
        <section className="space-y-6">
          <Badge className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Enterprise RBAC ready
          </Badge>
          <h1 className="text-4xl font-semibold leading-tight lg:text-5xl">
            SchoolHub unifies enrollment, courses, quizzes and assignments for
            modern schools.
          </h1>
          <p className="text-lg text-muted-foreground">
            Built with Next.js 15, shadcn/ui, TanStack Query and Zustand, this client
            mirrors the API contract inside docs/requirement.md.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard">
                Explore console
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/docs/requirement">Read requirements</Link>
            </Button>
          </div>
        </section>
        <Card className="backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <p className="text-sm text-muted-foreground">
              Wire this form up to the `/auth/login` endpoint once the API is live.
            </p>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
