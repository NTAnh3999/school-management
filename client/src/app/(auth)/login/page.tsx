import { BookOpenText } from "lucide-react";

import { LoginForm } from "../_feature/components/login-form";

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCRNIOWEPWEb2uUxoFys2PI3bcEs9d4ZuCy0juqAuEC04oykOV0wvdQTgP5DLvE0Ugg1TiS0KVEk_XmSJpWa4h6YOpZvY7oMi84dfzdEJsiwmdM3LMiFSnbuYBYGhFHE1JqWn0Fm5_6H39jRHd3bU6bxtRIXJ_QjSWDJo4wdaJgtz3pYAxBrcArL-pGjmBnRp0s6cjPqzzI7ybx0jL5ykQ5Vqx4eGSuOs-sqs9ea9B1deBWs3jbrtlC5-q3Mk9ZHeJQcht7Lvga3aaV";

export default function LoginPage() {
  return (
    <>
      <main className="flex min-h-screen items-center justify-center p-4 md:p-6">
        <div
          className="grid w-full max-w-[1200px] overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-lowest md:grid-cols-2"
          style={{ boxShadow: "var(--shadow-level-1)" }}
        >
          <section className="relative hidden min-h-[700px] overflow-hidden md:block">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroImage})` }}
            />
            <div className="absolute inset-0 bg-primary/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />

            <div className="relative flex h-full flex-col justify-between p-10">
              <div className="flex items-center gap-3 text-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                  <BookOpenText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-label-caps text-white/75">Patient mentor</p>
                  <p className="text-xl font-semibold">SchoolHub</p>
                </div>
              </div>

              <div className="max-w-md">
                <h1 className="text-5xl font-bold leading-tight text-white">
                  Return to a learning space built for focus.
                </h1>
                <p className="mt-4 font-reading text-lg leading-8 text-white/90">
                  Calm structure, clear progress, and just enough encouragement to
                  keep momentum visible without adding noise.
                </p>
                <div className="mt-8 flex items-center gap-4 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/90 text-secondary-foreground">
                    <BookOpenText className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-white">
                    More than 5,000 learners have already completed their focus
                    goals today.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col justify-center px-6 py-10 md:px-10 md:py-12 lg:px-12">
            <div className="mb-8 flex items-center gap-3 md:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_2px_0_hsl(var(--primary-press))]">
                <BookOpenText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-label-caps text-primary">Patient mentor</p>
                <p className="text-lg font-semibold text-foreground">SchoolHub</p>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[400px]">
              <LoginForm />
            </div>
          </section>
        </div>
      </main>

      <div className="pointer-events-none fixed -bottom-24 -left-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none fixed -right-24 -top-24 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />
    </>
  );
}
