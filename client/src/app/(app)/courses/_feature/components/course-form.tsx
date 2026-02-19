"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUpsertCourse } from "../hooks";

const schema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(3),
  startDate: z.string(),
  endDate: z.string(),
  teacherId: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  name: "",
  description: "",
  category: "",
  startDate: "",
  endDate: "",
  teacherId: "",
};

export function CourseForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const mutation = useUpsertCourse();

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success("Course saved");
        form.reset(defaultValues);
      },
      onError: () => toast.error("Unable to save course"),
    });
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="name">Course name</Label>
        <Input id="name" placeholder="e.g. Algebra I" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={4}
          placeholder="Give teachers and students the full context."
          {...form.register("description")}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" placeholder="Mathematics" {...form.register("category")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="teacherId">Primary teacher</Label>
          <Input id="teacherId" placeholder="teacher-id" {...form.register("teacherId")} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" {...form.register("startDate")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" type="date" {...form.register("endDate")} />
        </div>
      </div>

      <Button type="submit" className="w-full md:w-auto" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : "Save course"}
      </Button>
    </form>
  );
}
