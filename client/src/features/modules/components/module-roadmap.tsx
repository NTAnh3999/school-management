"use client";

import { ListTree } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockModules, mockActivities } from "@/data/mocks";

export function ModuleRoadmap() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListTree className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Module roadmap</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Organize module order and ensure each learning week has activities.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockModules.map((module) => {
          const activities = mockActivities.filter(
            (activity) => activity.moduleId === module.id
          );
          return (
            <div key={module.id} className="rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{module.title}</p>
                <Badge variant="outline">{activities.length} activities</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{module.description}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
