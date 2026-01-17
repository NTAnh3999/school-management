"use client";

import { Fragment } from "react";
import { KanbanSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockActivities } from "@/data/mocks";

const STATUS_COLUMNS = [
  { id: "scheduled", label: "Scheduled" },
  { id: "open", label: "Open" },
  { id: "closed", label: "Closed" },
] as const;

export function ActivityBoard() {
  const grouped = STATUS_COLUMNS.map((column) => ({
    column,
    activities: mockActivities.filter((activity) => activity.status === column.id),
  }));

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {grouped.map(({ column, activities }) => (
        <Card key={column.id} className="flex h-full flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <KanbanSquare className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">{column.label}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ScrollArea className="h-64">
              <div className="space-y-3 pr-2">
                {activities.map((activity) => (
                  <Fragment key={activity.id}>
                    <div className="rounded-lg border bg-card p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <Badge variant="outline" className="capitalize">
                          {activity.type}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Due {activity.dueDate}
                      </p>
                    </div>
                  </Fragment>
                ))}
                {!activities.length && (
                  <p className="text-sm text-muted-foreground">
                    Nothing in this column yet.
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
