"use client";

import RichContentRenderer, { hasRichTextVisualContent } from "@/components/blog/RichContentRenderer";
import { MediaPickerDialog } from "@/components/ui/media-picker-dialog";
import {
  MEDIA_RESIZE,
  ResizableImage,
  ResizableVideo,
  defaultInlineImageWidth,
} from "@/components/admin/rich-text-media-extensions";
import { CampaignDonationEmbedExtension } from "@/components/admin/rich-text-campaign-embed-extension";
import { CampaignDonationEmbedDialog } from "@/components/admin/CampaignDonationEmbedDialog";
import { ImageSliderExtension } from "@/components/admin/rich-text-image-slider-extension";
import { ImageSliderDialog } from "@/components/admin/ImageSliderDialog";
import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Code2,
  Heart,
  Italic,
  GalleryHorizontal,
  ImageIcon,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
  Video as VideoIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const FontSizeExtension = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              const fontSize = attributes.fontSize as string | null | undefined;
              if (!fontSize) return {};
              return { style: `font-size: ${fontSize}` };
            },
          },
        },
      },
    ];
  },
});

const FONT_FAMILY_OPTIONS = [
  { label: "Default Font", value: "default" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: '"Times New Roman", serif' },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Courier New", value: '"Courier New", monospace' },
];

const FONT_SIZE_OPTIONS = [
  { label: "Default Size", value: "default" },
  { label: "12px", value: "12px" },
  { label: "14px", value: "14px" },
  { label: "16px", value: "16px" },
  { label: "18px", value: "18px" },
  { label: "20px", value: "20px" },
  { label: "24px", value: "24px" },
  { label: "28px", value: "28px" },
  { label: "32px", value: "32px" },
];

const MEDIA_SIZE_PRESETS = [25, 50, 75, 100] as const;

type TextCaseOption = "uppercase" | "lowercase" | "titlecase" | "sentencecase";

const toTitleCase = (value: string) =>
  value.toLowerCase().replace(/\b([a-z])/g, (match) => match.toUpperCase());

function resizeSelectedMedia(editor: Editor, widthPercent: number) {
  const { selection } = editor.state;
  if (!(selection instanceof NodeSelection)) return;

  const node = selection.node;
  if (node.type.name !== "image" && node.type.name !== "video") return;

  const maxWidth = Math.max(editor.view.dom.clientWidth - 48, MEDIA_RESIZE.minWidth);
  const targetWidth = Math.round(maxWidth * (widthPercent / 100));

  const domAtPos = editor.view.nodeDOM(selection.from) as HTMLElement | null;
  const mediaEl = domAtPos?.querySelector?.("img, video") as HTMLElement | null;

  const currentWidth =
    (typeof node.attrs.width === "number" ? node.attrs.width : null) ||
    mediaEl?.offsetWidth ||
    targetWidth;
  const currentHeight =
    (typeof node.attrs.height === "number" ? node.attrs.height : null) ||
    mediaEl?.offsetHeight ||
    Math.round(targetWidth * 0.5625);

  const aspectRatio = currentWidth / currentHeight;
  const newHeight = Math.max(Math.round(targetWidth / aspectRatio), MEDIA_RESIZE.minHeight);

  editor.commands.updateAttributes(node.type.name, {
    width: targetWidth,
    height: newHeight,
  });
}

const selectClass =
  "h-8 rounded border border-gray-200 bg-white px-2 text-xs text-gray-800 min-w-0 max-w-full";

function ToolbarBtn({
  active,
  onClick,
  title,
  children,
  disabled,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`flex h-8 shrink-0 items-center justify-center rounded px-2 text-sm transition-colors disabled:opacity-40 ${
        active
          ? "bg-purple-600 text-white"
          : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

interface RichTextEditorProps {
  fieldName?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  error?: string;
  previewEmptyMessage?: string;
  minHeightClass?: string;
  /** Show toolbar control to embed a campaign donation block (blog articles). */
  enableCampaignEmbeds?: boolean;
}

export default function RichTextEditor({
  fieldName,
  value,
  onChange,
  placeholder = "Write content here.",
  error,
  previewEmptyMessage = "Add content to preview.",
  minHeightClass = "min-h-[260px]",
  enableCampaignEmbeds = false,
}: RichTextEditorProps) {
  const lastEmittedRef = useRef(value);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  const [caseOption, setCaseOption] = useState("");
  const [emojiOption, setEmojiOption] = useState("");
  const [fontFamily, setFontFamily] = useState("default");
  const [fontSize, setFontSize] = useState("default");
  const [textColor, setTextColor] = useState("#1a1a1a");
  const [markColor, setMarkColor] = useState("#fef08a");
  const [mediaPicker, setMediaPicker] = useState<"image" | "video" | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<"image" | "video" | null>(null);
  const [campaignEmbedOpen, setCampaignEmbedOpen] = useState(false);
  const [imageSliderOpen, setImageSliderOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      ImageSliderExtension,
      ...(enableCampaignEmbeds ? [CampaignDonationEmbedExtension] : []),
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      FontFamily.configure({ types: ["textStyle"] }),
      FontSizeExtension,
      Underline,
      Highlight.configure({ multicolor: true }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      ResizableImage.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: { class: "rte-inline-image max-w-full rounded-md align-middle" },
        resize: {
          enabled: true,
          directions: [...MEDIA_RESIZE.directions],
          minWidth: MEDIA_RESIZE.minWidth,
          minHeight: MEDIA_RESIZE.minHeight,
          alwaysPreserveAspectRatio: MEDIA_RESIZE.alwaysPreserveAspectRatio,
        },
      }),
      ResizableVideo,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        id: fieldName ?? "",
        "data-error-focus": "true",
        "aria-invalid": error ? "true" : "false",
        class: `${minHeightClass} w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20`,
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      lastEmittedRef.current = html;
      onChange(html);
    },
  });

  useEffect(() => {
    if (editor && value !== lastEmittedRef.current) {
      lastEmittedRef.current = value;
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;

    const syncSelectedMedia = () => {
      if (editor.isActive("image")) setSelectedMedia("image");
      else if (editor.isActive("video")) setSelectedMedia("video");
      else setSelectedMedia(null);
    };

    syncSelectedMedia();
    editor.on("selectionUpdate", syncSelectedMedia);
    return () => {
      editor.off("selectionUpdate", syncSelectedMedia);
    };
  }, [editor]);

  const handleSetLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter a URL", previousUrl ?? "");
    if (url === null) return;
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  };

  const handleInsertVideo = (videoUrl: string) => {
    if (!editor) return;
    const url = videoUrl.trim();
    if (!url) return;
    editor
      .chain()
      .focus()
      .insertContent([
        { type: "video", attrs: { src: url, controls: true, preload: "metadata" } },
        { type: "paragraph" },
      ])
      .run();
  };

  const handleInsertVideoByUrl = () => {
    const url = window.prompt("Enter a video URL (mp4/webm/ogg)", "");
    if (url === null) return;
    handleInsertVideo(url);
  };

  const handleMediaSelect = (url: string) => {
    if (!editor) return;

    if (mediaPicker === "image") {
      const width = defaultInlineImageWidth(editor.view.dom.clientWidth);
      editor.chain().focus().setImage({ src: url, width }).run();
    } else if (mediaPicker === "video") {
      handleInsertVideo(url);
    }

    setMediaPicker(null);
  };

  const handleHeadingChange = (next: string) => {
    if (!editor) return;
    if (next === "paragraph") {
      editor.chain().focus().setParagraph().run();
      return;
    }
    const level = Number(next.replace("h", "")) as 1 | 2 | 3 | 4 | 5 | 6;
    editor.chain().focus().setHeading({ level }).run();
  };

  const handleTextCaseChange = (type: TextCaseOption) => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    if (empty) return;
    const selectedText = editor.state.doc.textBetween(from, to, "\n");
    const transformed =
      type === "uppercase"
        ? selectedText.toUpperCase()
        : type === "lowercase"
          ? selectedText.toLowerCase()
          : type === "titlecase"
            ? toTitleCase(selectedText)
            : selectedText.charAt(0).toUpperCase() + selectedText.slice(1).toLowerCase();
    editor.chain().focus().insertContentAt({ from, to }, transformed).run();
  };

  const handleEmojiInsert = (emoji: string) => {
    if (!editor || !emoji) return;
    editor.chain().focus().insertContent(emoji).run();
  };

  const handleFontFamilyChange = (next: string) => {
    setFontFamily(next);
    if (!editor) return;
    if (next === "default") {
      editor.chain().focus().unsetFontFamily().run();
      return;
    }
    editor.chain().focus().setFontFamily(next).run();
  };

  const handleFontSizeChange = (next: string) => {
    setFontSize(next);
    if (!editor) return;
    if (next === "default") {
      editor.chain().focus().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run();
      return;
    }
    editor.chain().focus().setMark("textStyle", { fontSize: next }).run();
  };

  const handleTextColorChange = (next: string) => {
    setTextColor(next);
    if (!editor) return;
    editor.chain().focus().setColor(next).run();
  };

  const handleMarkColorChange = (next: string) => {
    setMarkColor(next);
    if (!editor) return;
    editor.chain().focus().setHighlight({ color: next }).run();
  };

  const headingValue = editor
    ? editor.isActive("heading", { level: 1 })
      ? "h1"
      : editor.isActive("heading", { level: 2 })
        ? "h2"
        : editor.isActive("heading", { level: 3 })
          ? "h3"
          : editor.isActive("heading", { level: 4 })
            ? "h4"
            : editor.isActive("heading", { level: 5 })
              ? "h5"
              : editor.isActive("heading", { level: 6 })
                ? "h6"
                : "paragraph"
    : "paragraph";

  return (
    <>
      <div
        data-field={fieldName}
        data-invalid={error ? "true" : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error && fieldName ? `${fieldName}-error` : undefined}
        className="rich-text-editor space-y-2"
      >
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("write")}
            className={`px-3 py-1.5 text-sm font-medium rounded-t ${
              activeTab === "write" ? "bg-purple-600 text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1.5 text-sm font-medium rounded-t ${
              activeTab === "preview" ? "bg-purple-600 text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Preview
          </button>
        </div>

        {activeTab === "write" && editor ? (
          <div className="space-y-2">
            {selectedMedia && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2">
                <span className="text-xs font-medium text-purple-900">
                  {selectedMedia === "image" ? "Image" : "Video"} size
                </span>
                {MEDIA_SIZE_PRESETS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => resizeSelectedMedia(editor, pct)}
                    className="h-7 rounded-md border border-purple-200 bg-white px-2.5 text-xs font-medium text-purple-900 hover:bg-purple-100"
                  >
                    {pct}%
                  </button>
                ))}
                <span className="text-[11px] text-purple-700">or drag the purple corner handles</span>
              </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <select
                  className={selectClass}
                  value={caseOption}
                  onChange={(e) => {
                    const v = e.target.value as TextCaseOption | "";
                    if (v) handleTextCaseChange(v);
                    setCaseOption("");
                  }}
                >
                  <option value="">Text case</option>
                  <option value="uppercase">UPPERCASE</option>
                  <option value="lowercase">lowercase</option>
                  <option value="titlecase">Title Case</option>
                  <option value="sentencecase">Sentence case</option>
                </select>
                <select
                  className={selectClass}
                  value={emojiOption}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) handleEmojiInsert(v);
                    setEmojiOption("");
                  }}
                >
                  <option value="">Emoji</option>
                  <option value="🙂">🙂</option>
                  <option value="✅">✅</option>
                  <option value="⭐">⭐</option>
                  <option value="📌">📌</option>
                  <option value="⚠️">⚠️</option>
                  <option value="🚀">🚀</option>
                  <option value="🎯">🎯</option>
                </select>
                <select
                  className={selectClass}
                  value={headingValue}
                  onChange={(e) => handleHeadingChange(e.target.value)}
                >
                  <option value="paragraph">Paragraph</option>
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                  <option value="h4">Heading 4</option>
                  <option value="h5">Heading 5</option>
                  <option value="h6">Heading 6</option>
                </select>
                <select
                  className={selectClass}
                  value={fontFamily}
                  onChange={(e) => handleFontFamilyChange(e.target.value)}
                >
                  {FONT_FAMILY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  className={selectClass}
                  value={fontSize}
                  onChange={(e) => handleFontSizeChange(e.target.value)}
                >
                  {FONT_SIZE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <div className="flex h-8 items-center gap-1 rounded border border-gray-200 bg-white px-2">
                  <span className="text-[10px] font-medium text-gray-500">A</span>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => handleTextColorChange(e.target.value)}
                    className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
                    title="Text color"
                  />
                </div>
                <div className="flex h-8 items-center gap-1 rounded border border-gray-200 bg-white px-2">
                  <span className="text-[10px] font-medium text-gray-500 bg-yellow-200 px-0.5">H</span>
                  <input
                    type="color"
                    value={markColor}
                    onChange={(e) => handleMarkColorChange(e.target.value)}
                    className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
                    title="Highlight color"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                <ToolbarBtn
                  active={editor.isActive("bold")}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor.isActive("italic")}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor.isActive("underline")}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  title="Underline"
                >
                  <span className="text-sm font-bold underline">U</span>
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor.isActive("strike")}
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  title="Strikethrough"
                >
                  <span className="text-sm line-through">S</span>
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor.isActive("highlight")}
                  onClick={() => editor.chain().focus().toggleHighlight({ color: markColor }).run()}
                  title="Highlight"
                >
                  <span className="bg-yellow-200 px-1 text-xs font-bold">H</span>
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor.isActive("code")}
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  title="Inline code"
                >
                  <Code className="h-4 w-4" />
                </ToolbarBtn>

                <div className="w-px bg-gray-300 mx-1 self-stretch min-h-8" />

                <ToolbarBtn
                  active={editor.isActive("bulletList")}
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  title="Bullet list"
                >
                  <List className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor.isActive("orderedList")}
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  title="Numbered list"
                >
                  <ListOrdered className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor.isActive("blockquote")}
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  title="Quote"
                >
                  <Quote className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor.isActive("codeBlock")}
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  title="Code block"
                >
                  <Code2 className="h-4 w-4" />
                </ToolbarBtn>

                <div className="w-px bg-gray-300 mx-1 self-stretch min-h-8" />

                <ToolbarBtn
                  active={editor.isActive({ textAlign: "left" })}
                  onClick={() => editor.chain().focus().setTextAlign("left").run()}
                  title="Align left"
                >
                  <AlignLeft className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor.isActive({ textAlign: "center" })}
                  onClick={() => editor.chain().focus().setTextAlign("center").run()}
                  title="Align center"
                >
                  <AlignCenter className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor.isActive({ textAlign: "right" })}
                  onClick={() => editor.chain().focus().setTextAlign("right").run()}
                  title="Align right"
                >
                  <AlignRight className="h-4 w-4" />
                </ToolbarBtn>

                <div className="w-px bg-gray-300 mx-1 self-stretch min-h-8" />

                <ToolbarBtn onClick={handleSetLink} title="Link">
                  <Link2 className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => setMediaPicker("image")} title="Image">
                  <ImageIcon className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => setMediaPicker("video")} title="Video">
                  <VideoIcon className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => setImageSliderOpen(true)} title="Image slider">
                  <GalleryHorizontal className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() =>
                    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                  }
                  title="Table"
                >
                  <span className="text-xs">Table</span>
                </ToolbarBtn>
                <ToolbarBtn onClick={handleInsertVideoByUrl} title="Video URL">
                  <span className="text-xs">URL</span>
                </ToolbarBtn>
                {enableCampaignEmbeds && (
                  <ToolbarBtn onClick={() => setCampaignEmbedOpen(true)} title="Campaign appeal embed">
                    <Heart className="h-4 w-4" />
                  </ToolbarBtn>
                )}
                <ToolbarBtn
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().chain().focus().undo().run()}
                  title="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().chain().focus().redo().run()}
                  title="Redo"
                >
                  <Redo2 className="h-4 w-4" />
                </ToolbarBtn>
              </div>
            </div>

            <EditorContent editor={editor} />
            <p className="text-xs text-muted-foreground">
              Images can sit inline with text — use size presets or drag the purple handles.
            </p>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        ) : activeTab === "write" ? (
          <div className="rounded-md border border-gray-200 bg-white px-4 py-8 text-sm text-gray-400">
            Loading editor...
          </div>
        ) : null}

        {activeTab === "preview" && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            {hasRichTextVisualContent(value) ? (
              <RichContentRenderer
                content={value}
                enableCampaignEmbeds={enableCampaignEmbeds}
                sliderAutoplay={false}
              />
            ) : (
              <p className="text-sm text-gray-400">{previewEmptyMessage}</p>
            )}
          </div>
        )}
      </div>

      <MediaPickerDialog
        open={mediaPicker !== null}
        onOpenChange={(open) => !open && setMediaPicker(null)}
        accept={mediaPicker === "video" ? "video" : "image"}
        title={mediaPicker === "video" ? "Upload or select video" : "Upload or select image"}
        onSelect={handleMediaSelect}
      />

      <ImageSliderDialog
        open={imageSliderOpen}
        onOpenChange={setImageSliderOpen}
        onConfirm={(images) => {
          editor?.chain().focus().insertImageSlider({ images }).run();
        }}
      />

      {enableCampaignEmbeds && (
        <CampaignDonationEmbedDialog
          open={campaignEmbedOpen}
          onOpenChange={setCampaignEmbedOpen}
          onSelect={({ slug, title }) => {
            editor?.chain().focus().insertCampaignDonationEmbed({ slug, title }).run();
          }}
        />
      )}
    </>
  );
}
