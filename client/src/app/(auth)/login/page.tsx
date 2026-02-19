import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoginForm } from "../_feature/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/50">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-20 lg:grid-cols-2">
        <section className="space-y-6">
          <Badge className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Enterprise RBAC ready
          </Badge>
          <h1 className="text-4xl font-semibold leading-tight lg:text-5xl">
            Welcome to SchoolHub
          </h1>
          <p className="text-lg text-muted-foreground">
            Sign in to access your dashboard and manage enrollments, courses, quizzes and assignments.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to home
              </Link>
            </Button>
          </div>
        </section>
        <Card className="backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access the platform.
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
