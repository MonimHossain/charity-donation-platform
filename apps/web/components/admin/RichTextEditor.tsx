"use client";

import MarkdownRenderer from "@/components/blog/MarkdownRenderer";
import BlogContentRenderer from "@/components/blog/BlogContentRenderer";
import { MediaPickerDialog } from "@/components/ui/media-picker-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MEDIA_RESIZE,
  ResizableImage,
  ResizableVideo,
  defaultInlineImageWidth,
} from "@/components/admin/rich-text-media-extensions";
import { CampaignDonationEmbedExtension } from "@/components/admin/rich-text-campaign-embed-extension";
import { CampaignDonationEmbedDialog } from "@/components/admin/CampaignDonationEmbedDialog";
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

function isHtmlEmpty(html: string) {
  return !html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim();
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

  const [caseOption, setCaseOption] = useState("");
  const [emojiOption, setEmojiOption] = useState("");
  const [fontFamily, setFontFamily] = useState("default");
  const [fontSize, setFontSize] = useState("default");
  const [textColor, setTextColor] = useState("#0b1f2a");
  const [markColor, setMarkColor] = useState("#fef08a");
  const [mediaPicker, setMediaPicker] = useState<"image" | "video" | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<"image" | "video" | null>(null);
  const [campaignEmbedOpen, setCampaignEmbedOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
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
        class: `${minHeightClass} w-full rounded-md border border-[#e1ddd2] bg-white px-3 py-2 text-sm text-[#0b1f2a] focus:outline-none`,
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
        className="rich-text-editor"
      >
        <Tabs defaultValue="write">
          <TabsList className="mb-4">
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="write">
            {editor ? (
              <div className="space-y-3">
                {selectedMedia && (
                  <div className="flex flex-wrap items-center gap-2 rounded-md border border-[#d0c4b0] bg-[#f9f6ee] px-3 py-2">
                    <span className="text-xs font-medium text-[#0b1f2a]">
                      {selectedMedia === "image" ? "Image" : "Video"} size
                    </span>
                    {MEDIA_SIZE_PRESETS.map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => resizeSelectedMedia(editor, pct)}
                        className="h-7 rounded-md border border-[#e1ddd2] bg-white px-2.5 text-xs font-medium text-[#0b1f2a] hover:bg-[#f3eee4]"
                      >
                        {pct}%
                      </button>
                    ))}
                    <span className="text-[11px] text-[#5f6f6b]">or drag the purple corner handles</span>
                  </div>
                )}

                <div className="rounded-md border border-[#e1ddd2] bg-[#f9f6ee] p-2">
                  <div className="mb-2 grid w-full grid-cols-1 gap-1 px-1 sm:grid-cols-2 xl:grid-cols-7">
                    <select
                      className="h-9 w-full rounded-md border border-[#e1ddd2] bg-white px-2 text-xs font-medium text-[#0b1f2a]"
                      value={caseOption}
                      onChange={(e) => {
                        const v = e.target.value as TextCaseOption | "";
                        if (v) handleTextCaseChange(v);
                        setCaseOption("");
                      }}
                    >
                      <option value="">Text Case</option>
                      <option value="uppercase">UPPERCASE</option>
                      <option value="lowercase">lowercase</option>
                      <option value="titlecase">Title Case</option>
                      <option value="sentencecase">Sentence case</option>
                    </select>

                    <select
                      className="h-9 w-full rounded-md border border-[#e1ddd2] bg-white px-2 text-xs font-medium text-[#0b1f2a]"
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
                      className="h-9 w-full rounded-md border border-[#e1ddd2] bg-white px-2 text-xs font-medium text-[#0b1f2a]"
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
                      className="h-9 w-full rounded-md border border-[#e1ddd2] bg-white px-2 text-xs font-medium text-[#0b1f2a]"
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
                      className="h-9 w-full rounded-md border border-[#e1ddd2] bg-white px-2 text-xs font-medium text-[#0b1f2a]"
                      value={fontSize}
                      onChange={(e) => handleFontSizeChange(e.target.value)}
                    >
                      {FONT_SIZE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex h-9 items-center justify-between rounded-md border border-[#e1ddd2] bg-white px-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5f6f6b]">
                        Text
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => handleTextColorChange(e.target.value)}
                          title="Text color"
                          className="h-6 w-8 cursor-pointer rounded border border-[#e1ddd2] bg-transparent p-0"
                        />
                        <button
                          type="button"
                          className="rounded border border-[#d0c4b0] px-1.5 py-0.5 text-[10px] font-semibold text-[#5f6f6b] hover:bg-[#f3eee4]"
                          onClick={() => {
                            setTextColor("#0b1f2a");
                            editor.chain().focus().unsetColor().run();
                          }}
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    <div className="flex h-9 items-center justify-between rounded-md border border-[#e1ddd2] bg-white px-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5f6f6b]">
                        Mark
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={markColor}
                          onChange={(e) => handleMarkColorChange(e.target.value)}
                          title="Marking color"
                          className="h-6 w-8 cursor-pointer rounded border border-[#e1ddd2] bg-transparent p-0"
                        />
                        <button
                          type="button"
                          className="rounded border border-[#d0c4b0] px-1.5 py-0.5 text-[10px] font-semibold text-[#5f6f6b] hover:bg-[#f3eee4]"
                          onClick={() => editor.chain().focus().unsetHighlight().run()}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-2 grid w-full grid-cols-3 gap-1 px-1 sm:grid-cols-6">
                    <Button
                      type="button"
                      size="sm"
                      variant={editor.isActive("bold") ? "default" : "outline"}
                      className="h-9 w-full p-0"
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      title="Bold (Ctrl+B)"
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={editor.isActive("italic") ? "default" : "outline"}
                      className="h-9 w-full p-0"
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      title="Italic (Ctrl+I)"
                    >
                      <Code2 className="h-4 w-4 -skew-x-12" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={editor.isActive("underline") ? "default" : "outline"}
                      className="h-9 w-full p-0"
                      onClick={() => editor.chain().focus().toggleUnderline().run()}
                      title="Underline"
                    >
                      <span className="text-sm font-bold">U̲</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={editor.isActive("strike") ? "default" : "outline"}
                      className="h-9 w-full p-0"
                      onClick={() => editor.chain().focus().toggleStrike().run()}
                      title="Strikethrough"
                    >
                      <span className="text-sm line-through">S</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={editor.isActive("highlight") ? "default" : "outline"}
                      className="h-9 w-full p-0"
                      onClick={() => editor.chain().focus().toggleHighlight({ color: markColor }).run()}
                      title="Highlight / Mark"
                    >
                      <span className="bg-yellow-200 px-1 text-xs font-bold">H</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={editor.isActive("code") ? "default" : "outline"}
                      className="h-9 w-full p-0"
                      onClick={() => editor.chain().focus().toggleCode().run()}
                      title="Inline Code"
                    >
                      <Code className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mb-2 grid w-full grid-cols-4 gap-1 px-1 sm:grid-cols-7">
                    <Button
                      type="button"
                      size="sm"
                      variant={editor.isActive("bulletList") ? "default" : "outline"}
                      className="h-9 w-full p-0"
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      title="Bullet List"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={editor.isActive("orderedList") ? "default" : "outline"}
                      className="h-9 w-full p-0"
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      title="Ordered List"
                    >
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={editor.isActive("blockquote") ? "default" : "outline"}
                      className="h-9 w-full p-0"
                      onClick={() => editor.chain().focus().toggleBlockquote().run()}
                      title="Quote"
                    >
                      <Quote className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={editor.isActive("codeBlock") ? "default" : "outline"}
                      className="h-9 w-full p-0"
                      onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                      title="Code Block"
                    >
                      <Code2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={editor.isActive({ textAlign: "left" }) ? "default" : "outline"}
                      className="h-9 w-full p-0"
                      onClick={() => editor.chain().focus().setTextAlign("left").run()}
                      title="Align Left"
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={editor.isActive({ textAlign: "center" }) ? "default" : "outline"}
                      className="h-9 w-full p-0"
                      onClick={() => editor.chain().focus().setTextAlign("center").run()}
                      title="Align Center"
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={editor.isActive({ textAlign: "right" }) ? "default" : "outline"}
                      className="h-9 w-full p-0"
                      onClick={() => editor.chain().focus().setTextAlign("right").run()}
                      title="Align Right"
                    >
                      <AlignRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid w-full grid-cols-2 gap-1 px-1 sm:grid-cols-4 lg:grid-cols-8">
                    <Button type="button" size="sm" variant="outline" className="h-9 w-full px-2 text-xs" onClick={handleSetLink} title="Insert Link">
                      <Link2 className="mr-1 h-4 w-4" />
                      Link
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 w-full px-2 text-xs"
                      onClick={() => setMediaPicker("image")}
                      title="Insert image from media library"
                    >
                      <ImageIcon className="mr-1 h-4 w-4" />
                      Image
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 w-full px-2 text-xs"
                      onClick={() => setMediaPicker("video")}
                      title="Insert video from media library"
                    >
                      <VideoIcon className="mr-1 h-4 w-4" />
                      Video
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 w-full px-2 text-xs"
                      onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                      title="Insert Table"
                    >
                      Table
                    </Button>
                    {enableCampaignEmbeds && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 w-full px-2 text-xs"
                        onClick={() => setCampaignEmbedOpen(true)}
                        title="Insert campaign donation block"
                      >
                        <Heart className="mr-1 h-4 w-4" />
                        Appeal
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 w-full px-2 text-xs"
                      onClick={handleInsertVideoByUrl}
                      title="Insert video by URL"
                    >
                      URL
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 w-full p-0"
                      onClick={() => editor.chain().focus().undo().run()}
                      disabled={!editor.can().chain().focus().undo().run()}
                      title="Undo"
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 w-full p-0"
                      onClick={() => editor.chain().focus().redo().run()}
                      disabled={!editor.can().chain().focus().redo().run()}
                      title="Redo"
                    >
                      <Redo2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <EditorContent editor={editor} />
                <p className="text-xs text-muted-foreground">
                  Images can sit inline with text — use size presets or drag the purple handles. Existing saved content is unchanged.
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-[#e1ddd2] bg-white px-4 py-8 text-sm text-[#7a8a86]">
                Loading editor...
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview">
            <div className="rounded-lg border border-[#e1ddd2] bg-white p-6">
              {!isHtmlEmpty(value) ? (
                enableCampaignEmbeds ? (
                  <BlogContentRenderer content={value} />
                ) : (
                  <MarkdownRenderer content={value} />
                )
              ) : (
                <p className="text-sm text-[#7a8a86]">{previewEmptyMessage}</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <p id={fieldName ? `${fieldName}-error` : undefined} className="mt-2 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>

      <MediaPickerDialog
        open={mediaPicker !== null}
        onOpenChange={(open) => !open && setMediaPicker(null)}
        accept={mediaPicker === "video" ? "video" : "image"}
        title={mediaPicker === "video" ? "Upload or select video" : "Upload or select image"}
        onSelect={handleMediaSelect}
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
