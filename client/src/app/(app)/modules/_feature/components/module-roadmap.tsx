"use client";

import { ListTree } from "lucide-react";
import { useCourses } from "@/app/(app)/courses/_feature/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function ModuleRoadmap() {
  const { data: courses, isLoading } = useCourses();

  // Get sections from first available course
  const sections = courses?.[0]?.sections || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListTree className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Module roadmap</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Course sections and their lessons.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : sections.length > 0 ? (
          sections.map((section: any) => (
            <div key={section.id} className="rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{section.title}</p>
                <Badge variant="outline">
                  {section.lessons?.length || 0} lessons
                </Badge>
              </div>
              {section.description && (
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No sections available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
