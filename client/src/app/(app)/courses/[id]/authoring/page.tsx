"use client";

import { useState } from "react";
import { useCourse } from "../../_feature/hooks";
import { useSections, useCreateSection } from "../../_feature/sections/hooks";
import {
  useContentVersions,
  useCreateContentVersion,
  usePublishContentVersion,
  usePreviewDraftContent,
} from "../../_feature/content-versions/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Eye,
  Upload,
  BookOpen,
  Layers,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { ContentVersion } from "@/types/models";
import Link from "next/link";

const VERSION_STATUS_COLORS: Record<string, string> = {
  DRAFT: "secondary",
  REVIEW: "outline",
  PUBLISHED: "default",
  ARCHIVED: "destructive",
};

export default function CourseAuthoringPage({
  params,
}: {
  params: { id: string };
}) {
  const courseId = parseInt(params.id);
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: sectionsData, isLoading: sectionsLoading } =
    useSections(courseId);
  const { data: versionsData, isLoading: versionsLoading } =
    useContentVersions(courseId);

  const createSection = useCreateSection();
  const createVersion = useCreateContentVersion();
  const publishVersion = usePublishContentVersion();
  const previewQuery = usePreviewDraftContent(0); // lazy - only fetched on demand

  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionDesc, setNewSectionDesc] = useState("");
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);

  const [versionLabel, setVersionLabel] = useState("");
  const [versionChangelog, setVersionChangelog] = useState("");
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);

  const sections = sectionsData?.metadata?.sections ?? [];
  const versions: ContentVersion[] = versionsData?.metadata?.versions ?? [];

  const handleCreateSection = async () => {
    if (!newSectionTitle.trim()) return;
    try {
      await createSection.mutateAsync({
        courseId,
        data: {
          title: newSectionTitle,
          description: newSectionDesc,
          order_index: sections.length,
        },
      });
      toast.success("Module created");
      setNewSectionTitle("");
      setNewSectionDesc("");
      setSectionDialogOpen(false);
    } catch {
      toast.error("Failed to create module");
    }
  };

  const handleCreateVersion = async () => {
    if (!versionLabel.trim()) return;
    try {
      await createVersion.mutateAsync({
        courseId,
        data: { versionLabel, changelog: versionChangelog },
      });
      toast.success("Content version created");
      setVersionLabel("");
      setVersionChangelog("");
      setVersionDialogOpen(false);
    } catch {
      toast.error("Failed to create content version");
    }
  };

  const handlePublish = async (versionId: number) => {
    try {
      await publishVersion.mutateAsync(versionId);
      toast.success("Content version published");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish";
      toast.error(msg);
    }
  };

  if (courseLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Course not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Course Content Authoring
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/courses/${courseId}`}>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View Course
            </Button>
          </Link>
          <Dialog open={versionDialogOpen} onOpenChange={setVersionDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Create Version
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Content Version</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label htmlFor="versionLabel">Version Label *</Label>
                  <Input
                    id="versionLabel"
                    placeholder="e.g. v1.0 - Initial Release"
                    value={versionLabel}
                    onChange={(e) => setVersionLabel(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="changelog">Changelog</Label>
                  <Textarea
                    id="changelog"
                    placeholder="Describe what changed in this version..."
                    value={versionChangelog}
                    onChange={(e) => setVersionChangelog(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateVersion}
                  disabled={createVersion.isPending || !versionLabel.trim()}
                >
                  {createVersion.isPending ? "Creating..." : "Create Version"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Learning Structure */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Learning Structure
              </CardTitle>
              <Dialog
                open={sectionDialogOpen}
                onOpenChange={setSectionDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Module
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Module</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1">
                      <Label htmlFor="sectionTitle">Module Title *</Label>
                      <Input
                        id="sectionTitle"
                        placeholder="Enter module title"
                        value={newSectionTitle}
                        onChange={(e) => setNewSectionTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sectionDesc">Description</Label>
                      <Textarea
                        id="sectionDesc"
                        placeholder="Optional description"
                        value={newSectionDesc}
                        onChange={(e) => setNewSectionDesc(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateSection}
                      disabled={
                        createSection.isPending || !newSectionTitle.trim()
                      }
                    >
                      {createSection.isPending
                        ? "Creating..."
                        : "Create Module"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {sectionsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <BookOpen className="w-10 h-10 mb-2 opacity-40" />
                  <p>No modules yet. Add the first module to get started.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sections.map((section: any) => (
                    <div
                      key={section.id}
                      className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono w-5 text-center">
                            {section.order_index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-sm">
                              {section.title}
                            </p>
                            {section.description && (
                              <p className="text-xs text-muted-foreground">
                                {section.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              section.status === "archived"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {section.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {section.lessons?.length ?? 0} lesson
                            {section.lessons?.length !== 1 ? "s" : ""}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                      {/* Lessons list */}
                      {section.lessons && section.lessons.length > 0 && (
                        <div className="mt-2 ml-7 space-y-1">
                          {section.lessons.map((lesson: any) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between text-sm border-l-2 border-muted pl-3 py-1"
                            >
                              <span>{lesson.title}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {lesson.lesson_type}
                                </Badge>
                                <Badge
                                  variant={
                                    lesson.status === "archived"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {lesson.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Content Versions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Content Versions</CardTitle>
            </CardHeader>
            <CardContent>
              {versionsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : versions.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No versions yet. Create a version to start the publish
                  workflow.
                </p>
              ) : (
                <div className="space-y-3">
                  {versions.map((v) => (
                    <div key={v.id} className="border rounded-md p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {v.version_label}
                        </span>
                        <Badge
                          variant={
                            (VERSION_STATUS_COLORS[v.status] ??
                              "secondary") as any
                          }
                          className="text-xs"
                        >
                          {v.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        v{v.version_no}
                      </p>
                      {v.changelog && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {v.changelog}
                        </p>
                      )}
                      {v.published_at && (
                        <p className="text-xs text-muted-foreground">
                          Published:{" "}
                          {new Date(v.published_at).toLocaleDateString()}
                        </p>
                      )}
                      {(v.status === "DRAFT" || v.status === "REVIEW") && (
                        <Button
                          size="sm"
                          variant="default"
                          className="w-full text-xs"
                          onClick={() => handlePublish(v.id)}
                          disabled={publishVersion.isPending}
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Publish
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
