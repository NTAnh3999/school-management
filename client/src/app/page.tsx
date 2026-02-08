"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/stores/session-store";

export default function HomePage() {
  const router = useRouter();
  const accessToken = useSessionStore((state) => state.accessToken);

  useEffect(() => {
    if (accessToken) {
      router.push("/dashboard");
    }
  }, [accessToken, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/50">
      <div className="mx-auto max-w-4xl space-y-12 px-6 pb-16 pt-20 text-center">
        <section className="space-y-6">
          <Badge className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Enterprise RBAC ready
          </Badge>
          <h1 className="text-4xl font-semibold leading-tight lg:text-6xl">
            SchoolHub unifies enrollment, courses, quizzes and assignments for
            modern schools.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Built with Next.js 15, shadcn/ui, TanStack Query and Zustand, this
            client mirrors the API contract inside docs/requirement.md.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/login">
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/dashboard">Explore console</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
