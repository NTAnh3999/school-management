"use client";

import { ModuleRoadmap } from "./_feature/components/module-roadmap";
import { ActivityBoard } from "@/app/(app)/activities/_feature/components/activity-board";

export default function ModulesPage() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Modules, activities and quiz/assignment relationships can live
        side-by-side.
      </p>
      <ModuleRoadmap />
      <ActivityBoard />
    </div>
  );
}
