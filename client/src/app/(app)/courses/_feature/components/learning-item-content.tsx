"use client";

import DOMPurify from "dompurify";
import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Download,
  ExternalLink as ExternalLinkIcon,
  File,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useContentAsset } from "../content-assets/hooks";
import { H5pPlayer } from "./h5p-player";
import { Model3DViewer } from "./model3d-viewer";
import { resolveAssetUrl } from "@/lib/content-asset";
import type {
  AssessmentReferenceContentPayload,
  ExternalLinkContentPayload,
  KnowledgeCheckContentPayload,
  LearningItem,
  TextContentPayload,
  VideoContentPayload,
} from "@/types/models";

// Same allowlist as the admin authoring surface's RichTextEditor output —
// Text items are authored as TipTap HTML and must be sanitized before
// rendering with dangerouslySetInnerHTML.
const RICH_TEXT_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "strong", "em", "u", "s", "code", "pre", "h2", "h3", "ul", "ol",
    "li", "a", "blockquote", "hr",
  ],
  ALLOWED_ATTR: ["href", "target", "rel"],
};

function TextItem({ item }: { item: LearningItem }) {
  const payload = item.content_payload as TextContentPayload | undefined;
  const body = payload?.body ?? "";
  if (!body) {
    return <p className="text-sm text-muted-foreground">No content.</p>;
  }
  const sanitized = DOMPurify.sanitize(body, RICH_TEXT_SANITIZE_CONFIG);
  return (
    <div
      className="max-w-reading text-[17px] leading-8 text-on-surface [&_a]:text-primary [&_a]:underline [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc"
      // eslint-disable-next-line react/no-danger -- sanitized immediately above via DOMPurify.
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

function ExternalLinkItem({ item }: { item: LearningItem }) {
  const payload = item.content_payload as ExternalLinkContentPayload | undefined;
  if (!payload?.url) {
    return <p className="text-sm text-muted-foreground">No URL set.</p>;
  }
  return (
    <Button asChild>
      <a href={payload.url} target="_blank" rel="noreferrer">
        Open link
        <ExternalLinkIcon className="ml-2 h-4 w-4" />
      </a>
    </Button>
  );
}

function AssessmentReferenceItem({
  item,
  courseId,
}: {
  item: LearningItem;
  courseId: number;
}) {
  const payload = item.content_payload as AssessmentReferenceContentPayload | undefined;
  if (!payload?.assessment_id) {
    return <p className="text-sm text-muted-foreground">No assessment linked.</p>;
  }
  return (
    <Button asChild>
      <a href={`/assessments/${payload.assessment_id}`}>
        Go to assessment
        <ExternalLinkIcon className="ml-2 h-4 w-4" />
      </a>
    </Button>
  );
}

function KnowledgeCheckItem({ item }: { item: LearningItem }) {
  const payload = item.content_payload as KnowledgeCheckContentPayload | undefined;
  const questions = payload?.questions ?? [];
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (questions.length === 0) {
    return <p className="text-sm text-muted-foreground">No questions configured.</p>;
  }

  const correctCount = questions.reduce(
    (sum, q, i) => sum + (answers[i] === q.correct_index ? 1 : 0),
    0,
  );

  return (
    <div className="space-y-6">
      {questions.map((question, qIndex) => (
        <div key={qIndex} className="rounded-2xl border border-outline-variant/40 bg-surface-container-low p-4">
          <p className="mb-3 text-sm font-semibold text-on-surface">
            {qIndex + 1}. {question.text}
          </p>
          <div className="space-y-2">
            {question.options.map((option, oIndex) => {
              const isSelected = answers[qIndex] === oIndex;
              const isCorrect = submitted && oIndex === question.correct_index;
              const isWrongSelected = submitted && isSelected && oIndex !== question.correct_index;
              return (
                <button
                  key={oIndex}
                  type="button"
                  disabled={submitted}
                  onClick={() => setAnswers((prev) => ({ ...prev, [qIndex]: oIndex }))}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                    isCorrect
                      ? "border-secondary/40 bg-secondary/10"
                      : isWrongSelected
                        ? "border-destructive/40 bg-destructive/10"
                        : isSelected
                          ? "border-primary/40 bg-primary/10"
                          : "border-outline-variant/40 bg-white hover:border-primary/20"
                  }`}
                >
                  {isSelected ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  {option.text}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted ? (
        <Button
          disabled={Object.keys(answers).length < questions.length}
          onClick={() => setSubmitted(true)}
        >
          Check answers
        </Button>
      ) : (
        <p className="text-sm font-semibold text-on-surface">
          {correctCount} / {questions.length} correct
        </p>
      )}
    </div>
  );
}

function AssetBackedItem({ item }: { item: LearningItem }) {
  const { data: asset, isLoading } = useContentAsset(item.asset_id);

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }
  if (!asset) {
    return <p className="text-sm text-muted-foreground">No asset attached.</p>;
  }

  const url = resolveAssetUrl(asset);
  if (!url) {
    return <p className="text-sm text-muted-foreground">This asset has no resolvable location.</p>;
  }

  if (asset.media_type === "video") {
    return <video src={url} controls className="w-full max-h-[480px] rounded-2xl" />;
  }
  if (asset.media_type === "image") {
    // eslint-disable-next-line @next/next/no-img-element -- external/API-hosted image, not a
    // build-time-known static asset next/image can optimize.
    return <img src={url} alt={asset.filename} className="max-h-[480px] w-full rounded-2xl object-contain" />;
  }
  if (asset.media_type === "audio") {
    return <audio src={url} controls className="w-full" />;
  }
  if (asset.media_type === "model3d") {
    return <Model3DViewer src={url} alt={asset.filename} />;
  }
  if (asset.media_type === "h5p") {
    return <H5pPlayer h5pJsonPath={url} height={480} />;
  }

  // Document / other: no browser-native inline viewer, offer a download link.
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low p-4">
      <File className="h-8 w-8 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-on-surface">{asset.filename}</p>
        <p className="text-xs text-muted-foreground">{asset.mime_type}</p>
      </div>
      <Button variant="outline" asChild>
        <a href={url} target="_blank" rel="noreferrer">
          <Download className="mr-2 h-4 w-4" />
          Download
        </a>
      </Button>
    </div>
  );
}

function VideoItem({ item }: { item: LearningItem }) {
  if (item.source === "external") {
    const payload = item.content_payload as VideoContentPayload | undefined;
    if (!payload?.url) {
      return <p className="text-sm text-muted-foreground">No video URL set.</p>;
    }
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-surface-container-low">
        <iframe
          src={payload.url}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return <AssetBackedItem item={item} />;
}

interface LearningItemContentProps {
  item: LearningItem;
  courseId: number;
}

// Renders a single learning item's body per its item_type — the piece the
// client previously had no equivalent of at all. Mirrors the item_type ->
// content shape contract in api/src/services/learning-item.service.js.
export function LearningItemContent({ item, courseId }: LearningItemContentProps) {
  switch (item.item_type) {
    case "Text":
      return <TextItem item={item} />;
    case "ExternalLink":
      return <ExternalLinkItem item={item} />;
    case "AssessmentReference":
      return <AssessmentReferenceItem item={item} courseId={courseId} />;
    case "KnowledgeCheck":
      return <KnowledgeCheckItem item={item} />;
    case "Video":
      return <VideoItem item={item} />;
    case "Document":
    case "Infographic":
    case "Model3D":
    case "InteractivePackage":
      return <AssetBackedItem item={item} />;
    default:
      return (
        <Badge variant="outline">Unsupported content type: {item.item_type}</Badge>
      );
  }
}
