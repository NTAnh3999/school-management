import { useState, useEffect, useRef, Component } from "react";
import type { ReactNode } from "react";
import { Modal, List, Button, Space, Tag, Popconfirm, Form, Input, InputNumber, Select, Checkbox, Radio, Upload, Image, message, Typography, Empty, Descriptions, Tooltip, Spin } from "antd";
import type { UploadProps } from "antd";
import { PlusOutlined, EditOutlined, InboxOutlined, UploadOutlined, EyeOutlined, LinkOutlined, FileOutlined, DownloadOutlined, DeleteOutlined, BoldOutlined, ItalicOutlined, UnderlineOutlined, UnorderedListOutlined, OrderedListOutlined } from "@ant-design/icons";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import DOMPurify from "dompurify";
import { PermissionGate } from "./PermissionGate";
import {
  useListLearningItemsQuery,
  useCreateLearningItemMutation,
  useUpdateLearningItemMutation,
  useArchiveLearningItemMutation,
  useReorderLearningItemsMutation,
  useListContentAssetsQuery,
  useUploadContentAssetMutation,
} from "@/store/api/courseContentApi";
import type { ContentAsset, LearningItem, LearningItemType, LearningItemCompletionRule, LearningItemVideoSource, KnowledgeCheckQuestion, KnowledgeCheckOption } from "@/types";
import { getErrorMessage } from "@/lib/error";
import { resolveAssetPreviewUrl } from "@/lib/content-asset";

const ITEM_TYPES: LearningItemType[] = [
  "Text",
  "Video",
  "Document",
  "Infographic",
  "ExternalLink",
  "KnowledgeCheck",
  "AssessmentReference",
  "Model3D",
  "InteractivePackage",
];

// FSD 5.4's fixed item_type -> completion_rule mapping, mirrored from the backend's
// COMPLETION_RULE_BY_ITEM_TYPE — shown read-only next to the type selector so authors see how
// the item will be marked complete without needing to pick it themselves.
const COMPLETION_RULE_BY_TYPE: Record<LearningItemType, LearningItemCompletionRule> = {
  Text: "dwell_time",
  Video: "watch_percentage",
  Document: "opened",
  Infographic: "opened",
  ExternalLink: "clicked",
  KnowledgeCheck: "submitted",
  AssessmentReference: "delegated",
  Model3D: "interacted",
  InteractivePackage: "xapi_statement",
};

// Item types whose reference_id must point at a registered ContentAsset (FSD 7.2/8.4 — subject
// to processing_status readiness gating at publish time).
const ASSET_REFERENCED_TYPES: LearningItemType[] = ["Document", "Infographic", "Model3D", "InteractivePackage"];

// Mirrors backend's KNOWLEDGE_CHECK_MIN_OPTIONS (api/src/constants/content.js).
const KNOWLEDGE_CHECK_MIN_OPTIONS = 2;

// Matches exactly what RichTextEditor's configured StarterKit extensions can emit, plus a
// handful of tags StarterKit includes by default that aren't wired to a toolbar button but are
// still reachable via keyboard shortcut / markdown-style input rules (e.g. a triple-backtick
// fence for a code block). Anything not in this list is stripped, regardless of DOMPurify's own
// broader default allowlist.
const RICH_TEXT_SANITIZE_CONFIG = {
  ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "s", "code", "pre", "h2", "h3", "ul", "ol", "li", "a", "blockquote", "hr"],
  ALLOWED_ATTR: ["href", "target", "rel"],
};

const ASSET_HELP: Partial<Record<LearningItemType, string>> = {
  Document: "Suggested formats: pdf, docx, pptx (≤ 50MB, pending Product/Infra confirmation).",
  Infographic: "Suggested formats: jpg, png, svg, webp (≤ 10MB, pending Product/Infra confirmation).",
  Model3D: "A .glb/.gltf asset, rendered with an embeddable 3D viewer.",
  InteractivePackage: "An H5P .h5p package, authored at h5p.org and uploaded here as a ContentAsset; played back via h5p-standalone.",
};

interface ItemFormValues {
  itemType: LearningItemType;
  title: string;
  isRequired?: boolean;
  groupWithNext?: boolean;
  estimatedDuration?: number;
  assetId?: number;
  source?: LearningItemVideoSource;
  url?: string;
  provider?: string;
  openInNewTab?: boolean;
  assessmentId?: number;
  body?: string;
  questions?: KnowledgeCheckQuestion[];
}

interface LearningItemManagerProps {
  lessonId: number;
  /** Skip the list query until the host surface (e.g. a lesson edit modal) is actually open. */
  active: boolean;
}

interface AssetPickerProps {
  value?: number;
  onChange?: (assetId: number | undefined) => void;
  assets: ContentAsset[] | undefined;
  /** Restricts both the "pick existing" list and the upload's accept filter (e.g. "video"). */
  mediaTypeFilter?: string;
}

// Lazily registers the <model-viewer> custom element on first use — deferred the same way
// admin-portal/src/app/routes.tsx defers whole pages via dynamic import(), rather than paid for
// on every page load via a main.tsx-level import, since @google/model-viewer is a non-trivial
// Web Component library (Lit + a glTF rendering runtime) most learning items never touch.
let modelViewerReadyPromise: Promise<void> | undefined;
function loadModelViewer(): Promise<void> {
  if (!modelViewerReadyPromise) {
    modelViewerReadyPromise = import("@google/model-viewer").then(() => undefined);
  }
  return modelViewerReadyPromise;
}

function useModelViewerReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    loadModelViewer().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return ready;
}

// Lazily loads h5p-standalone on first use — same pattern/justification as
// loadModelViewer()/useModelViewerReady(): frame.bundle.js alone is a non-trivial third-party
// runtime (~140KB minified) most learning items never touch, so it's deferred behind first use
// rather than paid for on every page load.
let h5pStandaloneReadyPromise: Promise<typeof import("h5p-standalone")> | undefined;
function loadH5pStandalone(): Promise<typeof import("h5p-standalone")> {
  if (!h5pStandaloneReadyPromise) {
    h5pStandaloneReadyPromise = import("h5p-standalone");
  }
  return h5pStandaloneReadyPromise;
}

// Fixed, stable path to h5p-standalone's OWN player runtime assets (frame.bundle.js, h5p.css) —
// copied once from node_modules/h5p-standalone/dist/ into admin-portal/public/h5p-player/. These
// are the SAME two files for every H5P render anywhere in the app — NOT per-upload content,
// unlike H5pPlayer's h5pJsonPath prop below, which points at one specific extracted .h5p package.
const H5P_PLAYER_FRAME_JS = "/h5p-player/frame.bundle.js";
const H5P_PLAYER_FRAME_CSS = "/h5p-player/styles/h5p.css";

interface H5pPlayerProps {
  /** The extracted H5P content folder's public URL, e.g. "/uploads/h5p/{id}/" (asset.storage_key). */
  h5pJsonPath: string;
  height: number;
}

// Imperative-widget integration: h5p-standalone's H5P class is NOT a custom element / React
// component (unlike <model-viewer> above) — it's an ordinary ES class whose constructor takes a
// raw DOM node + an options object and does its own internal DOM manipulation (injecting an
// iframe) inside that node, entirely outside React's render model. React's only job here is
// handing it a stable <div> via ref once mounted, inside a useEffect.
//
// No teardown/destroy call exists on H5P (not documented anywhere in the package) — its entire
// runtime lives inside the iframe it injects into the container div, so removing that div from
// the DOM (which happens automatically on unmount, e.g. via this file's Modals' destroyOnClose)
// IS the complete cleanup.
//
// H5pErrorBoundary exists because h5p-standalone doesn't fail gracefully when the uploaded
// package is missing a declared content-type library (e.g. H5P.Blanks not actually bundled
// inside the .h5p) -- confirmed by testing: frame.bundle.js throws an uncaught TypeError from
// its own jQuery-based init code (outside the Promise chain `new H5P(...)` returns, so
// H5pPlayer's own .catch() never sees it), which crashes the whole React tree since this app has
// no other error boundary. A class component is required here -- React only supports
// componentDidCatch/getDerivedStateFromError on classes, not hooks.
interface H5pErrorBoundaryState {
  hasError: boolean;
}

class H5pErrorBoundary extends Component<{ children: ReactNode }, H5pErrorBoundaryState> {
  state: H5pErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): H5pErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("H5P player crashed", error);
  }

  render() {
    if (this.state.hasError) {
      return <Typography.Text type="secondary">Failed to load this H5P package.</Typography.Text>;
    }
    return this.props.children;
  }
}

function H5pPlayer({ h5pJsonPath, height }: H5pPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    // KNOWN LIMITATION: h5p-standalone's frame.bundle.js doesn't fail gracefully when the
    // uploaded package is missing a declared content-type library (e.g. H5P.Blanks not actually
    // bundled inside the .h5p) -- confirmed by testing that it throws an uncaught TypeError from
    // its own jQuery-based init code. This exception is NOT thrown during this component's own
    // render/effect call stack, so a React Error Boundary can't catch it (confirmed -- tried
    // H5pErrorBoundary above first, it never fires for this case), and it was still reaching the
    // page as an uncaught error even after adding the iframe-targeted listener below (an
    // about:blank iframe is present per Playwright's page.frames() at failure time, suggesting
    // the throw happens inside it, but this listener did not reliably intercept it either in
    // testing -- the exact timing/target was not conclusively pinned down). Left in place as a
    // best-effort guard since it's harmless when it doesn't fire, but a malformed .h5p package
    // (missing a declared library) can still crash this preview in some cases. Authors should
    // verify their .h5p bundles all required libraries before upload; a well-formed package
    // (confirmed working end-to-end in testing) does not hit this at all.
    let observedIframeWindow: Window | null = null;
    const onIframeError = (event: ErrorEvent) => {
      console.error("h5p-standalone's player runtime threw during load", event.error);
      if (!cancelled) setStatus("error");
      event.preventDefault();
    };

    const attachToIframeIfPresent = () => {
      const iframe = containerRef.current?.querySelector("iframe");
      if (iframe && iframe.contentWindow && iframe.contentWindow !== observedIframeWindow) {
        observedIframeWindow = iframe.contentWindow;
        observedIframeWindow.addEventListener("error", onIframeError);
      }
    };

    const observer = new MutationObserver(attachToIframeIfPresent);
    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true });
    }
    attachToIframeIfPresent(); // in case the iframe is already there by the time this effect runs

    loadH5pStandalone()
      .then(({ H5P }) => {
        if (cancelled || !containerRef.current) return;
        return new H5P(containerRef.current, {
          h5pJsonPath,
          frameJs: H5P_PLAYER_FRAME_JS,
          frameCss: H5P_PLAYER_FRAME_CSS,
        });
      })
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch((err) => {
        console.error("Failed to load H5P content", err);
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      observer.disconnect();
      observedIframeWindow?.removeEventListener("error", onIframeError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- height only affects the
    // container's own style, not the player load; h5pJsonPath is the only prop that should
    // re-trigger a fresh player load.
  }, [h5pJsonPath]);

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      {status === "loading" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Spin size="large" />
        </div>
      )}
      {status === "error" && <Typography.Text type="secondary">Failed to load this H5P package.</Typography.Text>}
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", display: status === "ready" ? "block" : "none" }}
      />
    </div>
  );
}

// Small inline preview so an author can confirm they picked/uploaded the right file before
// saving the item — image/video/audio/model3d/h5p only; document/other types show just the
// filename (no browser-native way to preview a PDF inline without a dedicated viewer).
function AssetPreview({ asset }: { asset: ContentAsset }) {
  const url = resolveAssetPreviewUrl(asset);
  const modelViewerReady = useModelViewerReady();
  if (!url) return null;
  if (asset.media_type === "image") {
    return <Image src={url} alt={asset.filename} width={120} style={{ borderRadius: 4 }} />;
  }
  if (asset.media_type === "video") {
    return <video src={url} controls style={{ width: 240, maxHeight: 160 }} />;
  }
  if (asset.media_type === "audio") {
    return <audio src={url} controls style={{ width: 240 }} />;
  }
  if (asset.media_type === "model3d") {
    if (!modelViewerReady) return <Spin />;
    return (
      <model-viewer
        src={url}
        alt={asset.filename}
        camera-controls
        auto-rotate
        style={{ width: 240, height: 240, borderRadius: 4, background: "#fafafa" }}
      />
    );
  }
  if (asset.media_type === "h5p") {
    return (
      <H5pErrorBoundary>
        <H5pPlayer h5pJsonPath={url} height={240} />
      </H5pErrorBoundary>
    );
  }
  return null;
}

// Full-size Model3D preview for the per-item and whole-lesson preview surfaces — larger than
// AssetPreview's compact 240x240 confirmation size, since 3D content needs real room to orbit
// around to be legible at all, mirroring how the Video-external branch below renders its own
// full-width player rather than reusing AssetPreview's smaller video size.
function Model3DPreview({ src, alt }: { src: string; alt: string }) {
  const modelViewerReady = useModelViewerReady();
  if (!modelViewerReady) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }
  return (
    <model-viewer
      src={src}
      alt={alt}
      camera-controls
      auto-rotate
      style={{ width: "100%", height: 480, borderRadius: 4, background: "#fafafa" }}
    />
  );
}

// Read-only content preview per item_type, so an author can confirm what a learner will actually
// see without going through the full Edit form. Deliberately separate from the Edit modal (view
// vs. mutate are different intents).
function LearningItemPreviewContent({ item, asset }: { item: LearningItem; asset: ContentAsset | undefined }) {
  const payload = item.content_payload as Record<string, unknown> | null;

  if (item.item_type === "Text") {
    const body = (payload?.body as string | undefined) ?? "";
    if (!body) {
      return <Typography.Text type="secondary"><em>No content.</em></Typography.Text>;
    }
    const sanitizedBody = DOMPurify.sanitize(body, RICH_TEXT_SANITIZE_CONFIG);
    return (
      <div
        className="rich-text-content"
        // eslint-disable-next-line react/no-danger -- sanitized immediately above via DOMPurify
        // with an explicit allowlist scoped to what RichTextEditor's TipTap config can produce.
        dangerouslySetInnerHTML={{ __html: sanitizedBody }}
      />
    );
  }

  if (item.item_type === "ExternalLink") {
    const url = payload?.url as string | undefined;
    return url ? (
      <Space direction="vertical">
        <Typography.Link href={url} target="_blank" rel="noreferrer">
          <LinkOutlined /> {url}
        </Typography.Link>
        {payload?.open_in_new_tab ? <Tag>opens in new tab</Tag> : null}
      </Space>
    ) : (
      <Typography.Text type="secondary">No URL set.</Typography.Text>
    );
  }

  if (item.item_type === "Video" && item.source === "external") {
    const url = payload?.url as string | undefined;
    const provider = payload?.provider as string | undefined;
    return url ? (
      <Space direction="vertical" style={{ width: "100%" }}>
        <video src={url} controls style={{ width: "100%", maxHeight: 360 }} onError={(e) => (e.currentTarget.style.display = "none")} />
        <Typography.Link href={url} target="_blank" rel="noreferrer">
          {url}
        </Typography.Link>
        {provider && <Tag>{provider}</Tag>}
      </Space>
    ) : (
      <Typography.Text type="secondary">No URL set.</Typography.Text>
    );
  }

  if (item.item_type === "AssessmentReference") {
    const assessmentId = payload?.assessment_id as number | undefined;
    return (
      <Descriptions size="small" column={1} bordered>
        <Descriptions.Item label="Assessment ID">{assessmentId ?? "—"}</Descriptions.Item>
      </Descriptions>
    );
  }

  if (item.item_type === "KnowledgeCheck") {
    const questions = (payload?.questions as KnowledgeCheckQuestion[] | undefined) ?? [];
    return questions.length > 0 ? (
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        {questions.map((q, i) => (
          <div key={i}>
            <Typography.Text strong>{i + 1}. {q.text}</Typography.Text>
            <List
              size="small"
              dataSource={q.options}
              renderItem={(opt, optIndex) => (
                <List.Item>
                  {opt.text}
                  {optIndex === q.correct_index && <Tag color="green" style={{ marginLeft: 8 }}>Correct</Tag>}
                </List.Item>
              )}
            />
          </div>
        ))}
      </Space>
    ) : (
      <Typography.Text type="secondary">No questions configured yet.</Typography.Text>
    );
  }

  if (item.item_type === "Model3D") {
    if (!asset) {
      return <Typography.Text type="secondary">No asset attached.</Typography.Text>;
    }
    const modelUrl = resolveAssetPreviewUrl(asset);
    if (!modelUrl) {
      return (
        <Typography.Text type="secondary">
          This asset's storage key doesn't point to a browser-resolvable location.
        </Typography.Text>
      );
    }
    return <Model3DPreview src={modelUrl} alt={asset.filename} />;
  }

  if (item.item_type === "InteractivePackage") {
    if (!asset) {
      return <Typography.Text type="secondary">No asset attached.</Typography.Text>;
    }
    const h5pUrl = resolveAssetPreviewUrl(asset);
    if (!h5pUrl) {
      return (
        <Typography.Text type="secondary">
          This asset's storage key doesn't point to a browser-resolvable location.
        </Typography.Text>
      );
    }
    return (
      <H5pErrorBoundary>
        <H5pPlayer h5pJsonPath={h5pUrl} height={480} />
      </H5pErrorBoundary>
    );
  }

  // Document / Infographic / uploaded Video: backed by a ContentAsset.
  if (!asset) {
    return <Typography.Text type="secondary">No asset attached.</Typography.Text>;
  }
  if (asset.media_type === "image" || asset.media_type === "video" || asset.media_type === "audio") {
    return <AssetPreview asset={asset} />;
  }
  return (
    <Space direction="vertical">
      <Space>
        <FileOutlined />
        <Typography.Text>{asset.filename}</Typography.Text>
        <Tag>{asset.mime_type}</Tag>
      </Space>
      {resolveAssetPreviewUrl(asset) && (
        <Typography.Link href={resolveAssetPreviewUrl(asset)!} target="_blank" rel="noreferrer">
          <DownloadOutlined /> Download
        </Typography.Link>
      )}
    </Space>
  );
}

// Lets an author either pick an already-registered ContentAsset or upload a new file directly,
// registering it as a ContentAsset in one step (POST /content-assets/upload) instead of forcing
// a trip to the Content Assets page first. Uploaded files land in the same list immediately via
// the shared "Module" RTK Query tag, so switching back to "Pick existing" shows the new asset.
function AssetPicker({ value, onChange, assets, mediaTypeFilter }: AssetPickerProps) {
  const [uploadAsset, { isLoading: uploading }] = useUploadContentAssetMutation();
  const [mode, setMode] = useState<"existing" | "upload">("existing");

  const filteredAssets = mediaTypeFilter ? assets?.filter((a) => a.media_type === mediaTypeFilter) : assets;
  const selectedAsset = assets?.find((a) => a.id === value);

  const uploadProps: UploadProps = {
    accept:
      mediaTypeFilter === "video"
        ? "video/*"
        : mediaTypeFilter === "model3d"
          ? ".glb,.gltf"
          : mediaTypeFilter === "h5p"
            ? ".h5p"
            : undefined,
    showUploadList: false,
    disabled: uploading,
    customRequest: async (options) => {
      const file = options.file as File;
      try {
        const asset = await uploadAsset({ file }).unwrap();
        onChange?.(asset.id);
        message.success(`${file.name} uploaded`);
        options.onSuccess?.(asset);
      } catch (err) {
        message.error(getErrorMessage(err, "Upload failed"));
        options.onError?.(err as Error);
      }
    },
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={8}>
      <Radio.Group size="small" value={mode} onChange={(e) => setMode(e.target.value)}>
        <Radio.Button value="existing">Pick existing</Radio.Button>
        <Radio.Button value="upload">Upload new</Radio.Button>
      </Radio.Group>

      {mode === "existing" ? (
        <Select
          value={value}
          onChange={onChange}
          placeholder="Select a registered asset"
          options={filteredAssets?.map((a) => ({ label: a.filename, value: a.id }))}
          allowClear
        />
      ) : (
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />} loading={uploading}>
            {uploading ? "Uploading..." : "Choose file to upload"}
          </Button>
        </Upload>
      )}

      {selectedAsset && (
        <Space direction="vertical" size={4}>
          <AssetPreview asset={selectedAsset} />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {selectedAsset.filename} ({selectedAsset.processing_status})
          </Typography.Text>
        </Space>
      )}
    </Space>
  );
}

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

// Bridges TipTap's imperative editor API into the plain value/onChange contract Form.Item needs
// (same shape AssetPicker above already provides for assetId). useEditor's `content` option
// only seeds INITIAL content — not reactive to a changing `value` prop after mount. This file's
// one call site (the Add/Edit Modal, destroyOnClose'd) fully unmounts on every close, so every
// open mounts a fresh instance and rc-field-form resolves the Field's initial value
// synchronously on first render — the same mechanism that already makes Input.TextArea "just
// work" today. The guarded useEffect below is a defensive correctness net, not load-bearing for
// this call site.
function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, linkOnPaste: true },
      }),
    ],
    content: value ?? "",
    onUpdate: ({ editor: updatedEditor }) => {
      onChange?.(updatedEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const incoming = value ?? "";
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div
      style={
        {
          border: "1px solid #d9d9d9",
          borderRadius: 6,
          // Exposed as a CSS custom property so the .rich-text-editor-content:empty::before rule
          // in index.css can render it as a real in-editor placeholder without pulling in
          // TipTap's dedicated (separately-packaged) Placeholder extension for this first pass.
          "--rich-text-placeholder": `"${(placeholder ?? "").replace(/"/g, '\\"')}"`,
        } as React.CSSProperties
      }
    >
      <RichTextToolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="rich-text-editor-content"
        style={{ minHeight: 120, maxHeight: 320, overflowY: "auto", padding: "8px 11px" }}
      />
    </div>
  );
}

interface RichTextToolbarProps {
  editor: Editor;
}

// Small AntD-only toolbar — no separate UI kit, matching this file's exclusive use of antd
// throughout. Each button's pressed/active state uses Button's own `type` prop toggling between
// "default"/"primary", a real AntD API rather than custom styling.
function RichTextToolbar({ editor }: RichTextToolbarProps) {
  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    // eslint-disable-next-line no-alert -- acceptable first pass: single-field quick input,
    // matches this file's existing simplicity level, no precedent for a richer pattern here.
    const url = window.prompt("Link URL", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const buttons: Array<{
    key: string;
    icon: React.ReactNode;
    title: string;
    isActive: boolean;
    onClick: () => void;
  }> = [
    {
      key: "bold",
      icon: <BoldOutlined />,
      title: "Bold",
      isActive: editor.isActive("bold"),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      key: "italic",
      icon: <ItalicOutlined />,
      title: "Italic",
      isActive: editor.isActive("italic"),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      key: "underline",
      icon: <UnderlineOutlined />,
      title: "Underline",
      isActive: editor.isActive("underline"),
      onClick: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      key: "h2",
      icon: <span style={{ fontWeight: 600, fontSize: 12 }}>H2</span>,
      title: "Heading 2",
      isActive: editor.isActive("heading", { level: 2 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      key: "h3",
      icon: <span style={{ fontWeight: 600, fontSize: 12 }}>H3</span>,
      title: "Heading 3",
      isActive: editor.isActive("heading", { level: 3 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      key: "bulletList",
      icon: <UnorderedListOutlined />,
      title: "Bullet list",
      isActive: editor.isActive("bulletList"),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      key: "orderedList",
      icon: <OrderedListOutlined />,
      title: "Numbered list",
      isActive: editor.isActive("orderedList"),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      key: "link",
      icon: <LinkOutlined />,
      title: "Link (prompts for a URL)",
      isActive: editor.isActive("link"),
      onClick: setLink,
    },
  ];

  return (
    <Space
      size={4}
      style={{ padding: "6px 8px", borderBottom: "1px solid #f0f0f0", background: "#fafafa", flexWrap: "wrap" }}
    >
      {buttons.map((b) => (
        <Tooltip key={b.key} title={b.title}>
          <Button size="small" type={b.isActive ? "primary" : "default"} icon={b.icon} onClick={b.onClick} />
        </Tooltip>
      ))}
    </Space>
  );
}

// CCA-11: Preview Content — a read-only, top-to-bottom render of a lesson exactly as its
// Learning Items are ordered, each item's title as a heading with its content underneath. This
// is a lightweight stand-in for what the eventual Learning Delivery surface renders to a learner
// (CCA doesn't own that surface — FSD §2.2 — but authors need a way to sanity-check the whole
// lesson reads coherently, not just one item at a time).
function LessonPreviewContent({ items, assets }: { items: LearningItem[]; assets: ContentAsset[] | undefined }) {
  const sorted = [...items].sort((a, b) => a.display_order - b.display_order);

  if (sorted.length === 0) {
    return <Empty description="No learning items in this lesson yet." />;
  }

  return (
    <div style={{ width: "100%" }}>
      {sorted.map((item, index) => {
        // An item suppresses its own heading/tags (and its top gap) iff the item immediately
        // before it opted into grouping. This one-step-back check is what makes chains of 3+
        // work for free: each item only ever asks about its own immediate predecessor.
        const precedingItem = index > 0 ? sorted[index - 1] : undefined;
        const suppressOwnHeading = !!precedingItem?.group_with_next;

        return (
          <div key={item.id} style={{ marginTop: suppressOwnHeading ? 0 : index === 0 ? 0 : 24 }}>
            {!suppressOwnHeading && (
              <>
                <Typography.Title level={4} style={{ marginBottom: 4 }}>
                  {index + 1}. {item.title}
                </Typography.Title>
                <Space size={8} style={{ marginBottom: 8 }}>
                  <Tag>{item.item_type}</Tag>
                  {item.is_required && <Tag color="blue">required</Tag>}
                  {item.status === "archived" && <Tag>archived</Tag>}
                </Space>
              </>
            )}
            <LearningItemPreviewContent item={item} asset={assets?.find((a) => a.id === item.asset_id)} />
          </div>
        );
      })}
    </div>
  );
}

interface LessonPreviewButtonProps {
  lessonId: number;
  lessonTitle: string;
}

// Self-contained trigger + modal so it can be dropped anywhere in a lesson's own header (e.g.
// the Collapse panel's `extra`, alongside Edit/Archive/Delete) without that parent needing to
// manage the Learning Items query or preview state itself — mirrors how LearningItemManager is
// used as a drop-in elsewhere. Doesn't require content.version.manage: viewing a preview is not
// an edit action.
export function LessonPreviewButton({ lessonId, lessonTitle }: LessonPreviewButtonProps) {
  const [open, setOpen] = useState(false);
  const { data: items } = useListLearningItemsQuery(lessonId, { skip: !open });
  const { data: assets } = useListContentAssetsQuery(undefined, { skip: !open });

  return (
    <>
      <Button size="small" icon={<EyeOutlined />} onClick={() => setOpen(true)} title="Preview lesson" />
      <Modal
        title={`Preview — ${lessonTitle}`}
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnClose
        width={720}
      >
        <LessonPreviewContent items={items ?? []} assets={assets} />
      </Modal>
    </>
  );
}

// CCA-05: Manage Learning Item, per FSD 5.4's per-item_type payload/reference/completion_rule
// table — Text/Video/Document/Infographic/ExternalLink/KnowledgeCheck/AssessmentReference/
// Model3D/InteractivePackage. AssessmentReference only ever stores { assessment_id } per the
// FSD's Assessment boundary rule — no lookup against the Assessment module happens here.
// InteractivePackage/Model3D register asset metadata only; this module doesn't host an H5P
// runtime or 3D viewer itself (out of scope, same as every other ContentAsset-backed type).
//
// Bare content (no Modal wrapper) so it can be embedded directly inside the lesson edit modal,
// per the FSD-aligned "Edit lesson" layout — a lesson must already have an id for items to
// attach to, so this only renders once a lesson exists (see ModuleLessonEditor).
export function LearningItemManager({ lessonId, active }: LearningItemManagerProps) {
  const { data: items, isLoading } = useListLearningItemsQuery(lessonId, { skip: !active });
  const { data: assets } = useListContentAssetsQuery(undefined, { skip: !active });
  const [createItem, { isLoading: creating }] = useCreateLearningItemMutation();
  const [updateItem] = useUpdateLearningItemMutation();
  const [archiveItem] = useArchiveLearningItemMutation();
  const [reorderItems] = useReorderLearningItemsMutation();

  const [itemModal, setItemModal] = useState<{ mode: "create" | "edit"; item?: LearningItem } | null>(null);
  const [previewItem, setPreviewItem] = useState<LearningItem | null>(null);
  const [form] = Form.useForm<ItemFormValues>();
  const itemType = Form.useWatch("itemType", form);
  const videoSource = Form.useWatch("source", form);

  const moveItem = async (itemId: number, direction: -1 | 1) => {
    if (!items) return;
    const ordered = [...items].sort((a, b) => a.display_order - b.display_order);
    const index = ordered.findIndex((i) => i.id === itemId);
    const swapWith = index + direction;
    if (index < 0 || swapWith < 0 || swapWith >= ordered.length) return;
    [ordered[index], ordered[swapWith]] = [ordered[swapWith], ordered[index]];
    try {
      await reorderItems({ lessonId, orderedIds: ordered.map((i) => i.id) }).unwrap();
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to reorder learning items"));
    }
  };

  const openCreate = () => {
    form.resetFields();
    setItemModal({ mode: "create" });
  };

  const openEdit = (item: LearningItem) => {
    form.setFieldsValue({
      itemType: item.item_type,
      title: item.title,
      isRequired: item.is_required,
      groupWithNext: item.group_with_next,
      estimatedDuration: item.estimated_duration ?? undefined,
      assetId: item.asset_id ?? undefined,
      source: item.source ?? undefined,
      url:
        item.item_type === "ExternalLink" || (item.item_type === "Video" && item.source === "external")
          ? (item.content_payload?.url as string | undefined)
          : undefined,
      provider: item.item_type === "Video" ? (item.content_payload?.provider as string | undefined) : undefined,
      openInNewTab:
        item.item_type === "ExternalLink" ? (item.content_payload?.open_in_new_tab as boolean | undefined) : undefined,
      assessmentId:
        item.item_type === "AssessmentReference"
          ? (item.content_payload?.assessment_id as number | undefined)
          : undefined,
      body: item.item_type === "Text" ? (item.content_payload?.body as string | undefined) : undefined,
      questions:
        item.item_type === "KnowledgeCheck"
          ? (item.content_payload?.questions as KnowledgeCheckQuestion[] | undefined)
          : undefined,
    });
    setItemModal({ mode: "edit", item });
  };

  const submit = async (values: ItemFormValues) => {
    let contentPayload: Record<string, unknown> | undefined;
    if (values.itemType === "Text") {
      contentPayload = { format: "richtext", body: values.body };
    } else if (values.itemType === "ExternalLink") {
      contentPayload = { url: values.url, open_in_new_tab: values.openInNewTab ?? false };
    } else if (values.itemType === "Video" && values.source === "external") {
      contentPayload = { url: values.url, provider: values.provider || undefined };
    } else if (values.itemType === "AssessmentReference") {
      contentPayload = { assessment_id: values.assessmentId };
    } else if (values.itemType === "KnowledgeCheck") {
      contentPayload = { questions: values.questions ?? [] };
    }

    const isAssetReferenced = ASSET_REFERENCED_TYPES.includes(values.itemType);
    const assetId = isAssetReferenced || (values.itemType === "Video" && values.source === "uploaded")
      ? values.assetId
      : undefined;

    try {
      if (itemModal?.mode === "edit" && itemModal.item) {
        await updateItem({
          id: itemModal.item.id,
          revision: itemModal.item.revision,
          title: values.title,
          contentPayload,
          assetId,
          source: values.itemType === "Video" ? values.source : undefined,
          estimatedDuration: values.estimatedDuration,
          isRequired: values.isRequired,
          groupWithNext: values.groupWithNext,
        }).unwrap();
        message.success("Learning item updated");
      } else {
        await createItem({
          lessonId,
          itemType: values.itemType,
          title: values.title,
          contentPayload,
          assetId,
          source: values.itemType === "Video" ? values.source : undefined,
          estimatedDuration: values.estimatedDuration,
          isRequired: values.isRequired,
          groupWithNext: values.groupWithNext,
        }).unwrap();
        message.success("Learning item created");
      }
      setItemModal(null);
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to save learning item"));
    }
  };

  const sortedItems = items ? [...items].sort((a, b) => a.display_order - b.display_order) : [];

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={12}>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Typography.Text strong>Learning items {items ? `(${items.length})` : ""}</Typography.Text>
        <PermissionGate permission="content.version.manage">
          <Button size="small" icon={<PlusOutlined />} onClick={openCreate}>
            Add content
          </Button>
        </PermissionGate>
      </Space>

      {!isLoading && sortedItems.length === 0 ? (
        <Empty description="No learning items in this lesson yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          loading={isLoading}
          size="small"
          bordered
          dataSource={sortedItems}
          renderItem={(item, index) => (
            <List.Item
              actions={[
                <Button
                  key="preview"
                  size="small"
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => setPreviewItem(item)}
                />,
                <PermissionGate key="actions" permission="content.version.manage">
                  <Space>
                    <Button size="small" type="text" disabled={index === 0} onClick={() => moveItem(item.id, -1)}>
                      ↑
                    </Button>
                    <Button
                      size="small"
                      type="text"
                      disabled={index === sortedItems.length - 1}
                      onClick={() => moveItem(item.id, 1)}
                    >
                      ↓
                    </Button>
                    <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(item)} />
                    <Popconfirm title="Archive this item?" onConfirm={() => archiveItem(item.id)}>
                      <Button size="small" type="text" icon={<InboxOutlined />} disabled={item.status === "archived"} />
                    </Popconfirm>
                  </Space>
                </PermissionGate>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    {item.title}
                    <Tag>{item.item_type}</Tag>
                    {item.source && <Tag color="purple">{item.source}</Tag>}
                    {item.is_required && <Tag color="blue">required</Tag>}
                    {item.group_with_next && <Tag color="cyan">groups with next</Tag>}
                    {item.status === "archived" && <Tag>archived</Tag>}
                  </Space>
                }
                description={[
                  item.completion_rule,
                  item.estimated_duration ? `${item.estimated_duration} min` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
            </List.Item>
          )}
        />
      )}

      <Modal
        title={itemModal?.mode === "edit" ? "Edit learning item" : "Add learning item"}
        open={!!itemModal}
        onCancel={() => setItemModal(null)}
        onOk={() => form.validateFields().then(submit)}
        confirmLoading={creating}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="itemType" label="Type" rules={[{ required: true }]}>
            <Select
              disabled={itemModal?.mode === "edit"}
              options={ITEM_TYPES.map((t) => ({ label: t, value: t }))}
            />
          </Form.Item>
          {itemType && (
            <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: -12, marginBottom: 16 }}>
              Completion rule: <Typography.Text code>{COMPLETION_RULE_BY_TYPE[itemType]}</Typography.Text>
            </Typography.Text>
          )}
          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required." }]}>
            <Input placeholder="e.g. Introduction video" />
          </Form.Item>

          {itemType === "Text" && (
            <Form.Item
              name="body"
              label="Body"
              rules={[
                {
                  required: true,
                  message: "Body text is required.",
                  // TipTap's empty-document HTML is "<p></p>", not "" — the default
                  // required-field emptiness check only rejects ""/undefined/null, so it would
                  // incorrectly accept a body the author never actually typed into.
                  validator: async (_, value?: string) => {
                    const text = (value ?? "").replace(/<[^>]*>/g, "").trim();
                    if (!text) return Promise.reject(new Error("Body text is required."));
                  },
                },
              ]}
            >
              <RichTextEditor placeholder="Write the lesson content..." />
            </Form.Item>
          )}

          {itemType === "Video" && (
            <>
              <Form.Item name="source" label="Source" rules={[{ required: true }]}>
                <Radio.Group>
                  <Radio.Button value="uploaded">Uploaded asset</Radio.Button>
                  <Radio.Button value="external">External link</Radio.Button>
                </Radio.Group>
              </Form.Item>
              {videoSource === "uploaded" && (
                <Form.Item name="assetId" label="Video asset" rules={[{ required: true, message: "An uploaded video asset is required." }]}>
                  <AssetPicker assets={assets} mediaTypeFilter="video" />
                </Form.Item>
              )}
              {videoSource === "external" && (
                <>
                  <Form.Item name="url" label="URL" rules={[{ required: true, type: "url" }]}>
                    <Input placeholder="https://youtube.com/watch?v=..." />
                  </Form.Item>
                  <Form.Item name="provider" label="Provider (optional)">
                    <Input placeholder="youtube / vimeo" />
                  </Form.Item>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Watch-percentage tracking only works if the provider supports embed tracking (e.g.
                    YouTube, Vimeo). See OQ-CCA-11 for the fallback policy on unsupported providers.
                  </Typography.Text>
                </>
              )}
            </>
          )}

          {itemType === "ExternalLink" && (
            <>
              <Form.Item name="url" label="URL" rules={[{ required: true, type: "url" }]}>
                <Input placeholder="https://..." />
              </Form.Item>
              <Form.Item name="openInNewTab" valuePropName="checked">
                <Checkbox>Open in new tab</Checkbox>
              </Form.Item>
            </>
          )}

          {itemType === "AssessmentReference" && (
            <Form.Item
              name="assessmentId"
              label="Assessment ID"
              rules={[{ required: true, message: "An assessment_id is required." }]}
              tooltip="References an existing Assessment by id — grading/questions stay owned by the Assessment module."
            >
              <InputNumber style={{ width: "100%" }} min={1} />
            </Form.Item>
          )}

          {itemType === "KnowledgeCheck" && (
            <>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 16 }}>
                Lightweight quiz — % correct is tracked internally for statistics only and never pushed
                as a formal grade/transcript entry (FSD 5.4). Single-choice questions only: mark exactly
                one option as correct per question.
              </Typography.Text>

              <Form.List
                name="questions"
                rules={[
                  {
                    validator: async (_, questions?: KnowledgeCheckQuestion[]) => {
                      if (!questions || questions.length === 0) {
                        return Promise.reject(new Error("Add at least one question."));
                      }
                    },
                  },
                ]}
              >
                {(questionFields, { add: addQuestion, remove: removeQuestion }, { errors: questionListErrors }) => (
                  <Space direction="vertical" size={16} style={{ width: "100%" }}>
                    {questionFields.map(({ key: questionKey, ...questionField }, qIndex) => (
                      <div key={questionKey} style={{ border: "1px solid #f0f0f0", borderRadius: 4, padding: 12 }}>
                        <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 8 }}>
                          <Typography.Text strong>Question {qIndex + 1}</Typography.Text>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removeQuestion(questionField.name)}
                          />
                        </Space>

                        <Form.Item
                          {...questionField}
                          name={[questionField.name, "text"]}
                          rules={[{ required: true, message: "Question text is required." }]}
                        >
                          <Input placeholder="Question text" />
                        </Form.Item>

                        <Form.Item label="Options (mark the correct one)" required style={{ marginBottom: 0 }}>
                          {/* correct_index's Form.Item must live OUTSIDE the "options" Form.List's
                              render scope — AntD resolves a nested Form.Item's field path relative
                              to whichever Form.List's render-children subtree it's physically inside,
                              regardless of the absolute `name` array given. Nesting it inside the
                              options list silently wrote correct_index onto each option object
                              instead of onto the question, so it's declared here, one level up,
                              wrapping the options Form.List rather than living inside it. */}
                          <Form.Item
                            name={[questionField.name, "correct_index"]}
                            rules={[{ required: true, message: "Select the correct option." }]}
                            style={{ marginBottom: 8 }}
                          >
                            <Radio.Group style={{ width: "100%" }}>
                              <Form.List
                                name={[questionField.name, "options"]}
                                rules={[
                                  {
                                    validator: async (_, options?: KnowledgeCheckOption[]) => {
                                      if (!options || options.length < KNOWLEDGE_CHECK_MIN_OPTIONS) {
                                        return Promise.reject(
                                          new Error(`At least ${KNOWLEDGE_CHECK_MIN_OPTIONS} options are required.`)
                                        );
                                      }
                                    },
                                  },
                                ]}
                              >
                                {(optionFields, { add: addOption, remove: removeOption }, { errors: optionListErrors }) => (
                                  <>
                                    <Space direction="vertical" style={{ width: "100%" }}>
                                      {optionFields.map(({ key: optionKey, ...optionField }) => (
                                        <div key={optionKey} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                          <Radio value={optionField.name} />
                                          <Form.Item
                                            {...optionField}
                                            name={[optionField.name, "text"]}
                                            rules={[{ required: true, message: "Option text is required." }]}
                                            style={{ marginBottom: 0, flex: 1 }}
                                          >
                                            <Input placeholder={`Option ${optionField.name + 1}`} />
                                          </Form.Item>
                                          <Button
                                            type="text"
                                            danger
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            disabled={optionFields.length <= KNOWLEDGE_CHECK_MIN_OPTIONS}
                                            onClick={() => {
                                              // Re-derive correct_index if the removed option was the
                                              // correct one, or preceded it in the array — otherwise a
                                              // stale index silently points at the wrong (or a
                                              // now-nonexistent) option after removal.
                                              const path = ["questions", questionField.name, "correct_index"] as [
                                                "questions",
                                                number,
                                                "correct_index",
                                              ];
                                              const current = form.getFieldValue(path);
                                              removeOption(optionField.name);
                                              if (typeof current === "number") {
                                                if (current === optionField.name) {
                                                  form.setFields([{ name: path, value: undefined }]);
                                                } else if (current > optionField.name) {
                                                  form.setFields([{ name: path, value: current - 1 }]);
                                                }
                                              }
                                            }}
                                          />
                                        </div>
                                      ))}
                                    </Space>
                                    <Form.ErrorList errors={optionListErrors} />
                                    <Button
                                      type="dashed"
                                      size="small"
                                      icon={<PlusOutlined />}
                                      onClick={() => addOption({ text: "" })}
                                      style={{ marginTop: 8 }}
                                    >
                                      Add option
                                    </Button>
                                  </>
                                )}
                              </Form.List>
                            </Radio.Group>
                          </Form.Item>
                        </Form.Item>
                      </div>
                    ))}
                    <Form.ErrorList errors={questionListErrors} />
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() =>
                        addQuestion({ text: "", options: [{ text: "" }, { text: "" }], correct_index: undefined })
                      }
                      block
                    >
                      Add question
                    </Button>
                  </Space>
                )}
              </Form.List>
            </>
          )}

          {itemType === "Model3D" && (
            <Form.Item
              name="assetId"
              label="Content asset"
              rules={[{ required: true, message: "A content asset is required." }]}
              tooltip={ASSET_HELP.Model3D}
            >
              <AssetPicker assets={assets} mediaTypeFilter="model3d" />
            </Form.Item>
          )}
          {itemType === "InteractivePackage" && (
            <Form.Item
              name="assetId"
              label="Content asset"
              rules={[{ required: true, message: "A content asset is required." }]}
              tooltip={ASSET_HELP.InteractivePackage}
            >
              <AssetPicker assets={assets} mediaTypeFilter="h5p" />
            </Form.Item>
          )}
          {ASSET_REFERENCED_TYPES.includes(itemType) && itemType !== "Model3D" && itemType !== "InteractivePackage" && (
            <Form.Item
              name="assetId"
              label="Content asset"
              rules={[{ required: true, message: "A content asset is required." }]}
              tooltip={ASSET_HELP[itemType]}
            >
              <AssetPicker assets={assets} />
            </Form.Item>
          )}

          <Space size={16} style={{ display: "flex" }}>
            <Form.Item name="estimatedDuration" label="Estimated duration (min)" style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
            <Form.Item name="isRequired" valuePropName="checked" label=" " style={{ flex: 1 }}>
              <Checkbox>Required to complete the lesson</Checkbox>
            </Form.Item>
          </Space>
          <Form.Item name="groupWithNext" valuePropName="checked">
            <Checkbox>Group with next item (no heading/gap before the next item in Preview)</Checkbox>
          </Form.Item>
          {itemModal?.mode === "edit" && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Item type cannot be changed after creation — archive and re-create instead.
            </Typography.Text>
          )}
        </Form>
      </Modal>

      <Modal
        title={previewItem ? <Space>{previewItem.title} <Tag>{previewItem.item_type}</Tag></Space> : undefined}
        open={!!previewItem}
        onCancel={() => setPreviewItem(null)}
        footer={null}
        destroyOnClose
      >
        {previewItem && (
          <LearningItemPreviewContent
            item={previewItem}
            asset={assets?.find((a) => a.id === previewItem.asset_id)}
          />
        )}
      </Modal>
    </Space>
  );
}
