"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpenText,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSessionStore } from "@/stores/session-store";

const focusPrinciples = [
  {
    icon: Target,
    title: "Low-noise workspace",
    description:
      "A fixed-width learning canvas keeps attention on the next useful step instead of the chrome around it.",
  },
  {
    icon: BookOpenText,
    title: "Reading built for stamina",
    description:
      "Long-form content stays measured and calm, using Lexend and generous spacing to reduce visual stress.",
  },
  {
    icon: Trophy,
    title: "Milestones that stay meaningful",
    description:
      "Gold and purple appear only when progress is earned, so rewards still feel distinct and motivating.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const accessToken = useSessionStore((state) => state.accessToken);

  useEffect(() => {
    if (accessToken) {
      router.push("/dashboard");
    }
  }, [accessToken, router]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="mx-auto max-w-[1200px] px-6 pb-16 pt-6 lg:px-8 lg:pb-20 lg:pt-8">
        <header className="surface-float rounded-full border border-white/70 px-4 py-3 shadow-mentor">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_2px_0_hsl(var(--primary-press))]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-label-caps text-primary">Cognitive Clarity</p>
                <p className="text-sm font-semibold text-foreground">SchoolHub</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/dashboard">Explore workspace</Link>
              </Button>
              <Button asChild>
                <Link href="/login">
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="pt-10 lg:pt-14">
          <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div className="space-y-6">
              <Badge className="inline-flex w-fit items-center gap-2 bg-primary/10 text-primary">
                <ShieldCheck className="h-4 w-4" />
                Focused encouragement for modern learning
              </Badge>
              <div className="space-y-4">
                <h1 className="max-w-[11ch] text-5xl font-bold leading-[1.05] tracking-tight lg:text-7xl">
                  Calm structure.
                  <br />
                  Visible progress.
                </h1>
                <p className="font-reading reading-measure text-lg leading-8 text-muted-foreground lg:text-xl">
                  SchoolHub turns enrollment, learning modules, and assessment work
                  into a single environment designed to reduce cognitive load while
                  still making every small win feel earned.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href="/login">
                    Open learning hub
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/settings">Preview workspace tuning</Link>
                </Button>
              </div>
            </div>

            <Card className="surface-elevated overflow-hidden rounded-[2rem] border-white/80">
              <CardHeader className="space-y-3 pb-4">
                <p className="text-label-caps text-secondary">Mentor Preview</p>
                <CardTitle className="max-w-[14ch] text-2xl">
                  A dashboard that rewards steady momentum, not noise.
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-[1.5rem] border border-white/80 bg-white/90 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-label-caps text-primary">Today's focus</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">
                        Finish the next lesson review block
                      </p>
                    </div>
                    <Badge className="border-secondary/20 bg-secondary/10 text-secondary">
                      on track
                    </Badge>
                  </div>
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Weekly momentum</span>
                      <span className="font-semibold text-foreground">72%</span>
                    </div>
                    <Progress value={72} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-white/80 bg-white/80 p-4">
                    <p className="text-label-caps text-gold">Milestone</p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      7-day reading streak
                    </p>
                    <p className="mt-2 font-reading text-sm leading-6 text-muted-foreground">
                      Reward accents stay rare so meaningful progress remains visible.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/80 bg-surface-low p-4">
                    <p className="text-label-caps text-secondary">Reading Mode</p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      70-character measure
                    </p>
                    <p className="mt-2 font-reading text-sm leading-6 text-muted-foreground">
                      Designed to keep content easy to scan during longer sessions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mt-10 grid gap-4 lg:mt-12 lg:grid-cols-3">
            {focusPrinciples.map((principle) => (
              <Card key={principle.title} className="bg-white/80">
                <CardHeader className="pb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <principle.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="pt-3 text-xl">{principle.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-reading text-sm leading-7 text-muted-foreground">
                    {principle.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
