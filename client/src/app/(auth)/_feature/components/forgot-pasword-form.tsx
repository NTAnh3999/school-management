"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Mail } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForgotPassword } from "../hooks";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const forgotPassword = useForgotPassword();

  const onSubmit = (values: FormValues) => {
    forgotPassword.mutate(values, {
      onSuccess: () => setSent(true),
    });
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10 text-secondary">
          <CheckCircle className="h-7 w-7" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Check your inbox</p>
          <p className="mt-1 font-reading text-sm text-muted-foreground">
            If <strong>{form.getValues("email")}</strong> is registered, a reset
            link has been sent.
          </p>
        </div>
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => setSent(false)}
        >
          Try a different email
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-label-caps">
          EMAIL ADDRESS
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            className="pl-10"
            placeholder="you@example.com"
            {...form.register("email")}
          />
        </div>
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      <Button
        className="w-full"
        type="submit"
        disabled={forgotPassword.isPending}
      >
        {forgotPassword.isPending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
