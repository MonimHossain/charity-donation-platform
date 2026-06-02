"use client";

import MarkdownRenderer from "@/components/blog/MarkdownRenderer";
import { Extension, Node, mergeAttributes } from "@tiptap/core";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import TipTapImage from "@tiptap/extension-image";
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
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter, AlignLeft, AlignRight, Bold, Code, Code2,
  ImageIcon, Link2, List, ListOrdered, Quote, Redo2, Undo2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const FontSizeExtension = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [{
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
    }];
  },
});

const VideoExtension = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true, parseHTML: (el) => el.hasAttribute("controls") },
      poster: { default: null },
      preload: { default: "metadata" },
    };
  },
  parseHTML() { return [{ tag: "video[src]" }]; },
  renderHTML({ HTMLAttributes }) {
    return ["video", mergeAttributes(HTMLAttributes, {
      class: "my-3 w-full rounded-lg",
      controls: HTMLAttributes.controls === false ? undefined : "true",
      preload: HTMLAttributes.preload || "metadata",
    })];
  },
});

const FONT_FAMILIES = [
  { label: "Default", value: "default" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: "\"Times New Roman\", serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Courier New", value: "\"Courier New\", monospace" },
];

const FONT_SIZES = [
  { label: "Default", value: "default" },
  { label: "12px", value: "12px" }, { label: "14px", value: "14px" },
  { label: "16px", value: "16px" }, { label: "18px", value: "18px" },
  { label: "20px", value: "20px" }, { label: "24px", value: "24px" },
  { label: "28px", value: "28px" }, { label: "32px", value: "32px" },
];

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  error?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = "Write content here.", error }: RichTextEditorProps) {
  const lastEmittedRef = useRef(value);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [fontFamily, setFontFamily] = useState("default");
  const [fontSize, setFontSize] = useState("default");
  const [textColor, setTextColor] = useState("#1a1a1a");
  const [markColor, setMarkColor] = useState("#fef08a");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      FontFamily.configure({ types: ["textStyle"] }),
      FontSizeExtension,
      Underline,
      Highlight.configure({ multicolor: true }),
      LinkExtension.configure({ openOnClick: false, autolink: true, defaultProtocol: "https" }),
      TipTapImage.configure({ inline: false, allowBase64: true }),
      VideoExtension,
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "min-h-[300px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20",
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

  const handleSetLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter a URL", prev ?? "");
    if (url === null) return;
    const trimmed = url.trim();
    if (!trimmed) { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  };

  const handleInsertImage = () => {
    if (!editor) return;
    const url = window.prompt("Enter image URL", "");
    if (url) editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  const handleInsertVideo = () => {
    if (!editor) return;
    const url = window.prompt("Enter video URL (mp4/webm/ogg)", "");
    if (!url) return;
    editor.chain().focus().insertContent([
      { type: "video", attrs: { src: url.trim(), controls: true, preload: "metadata" } },
      { type: "paragraph" },
    ]).run();
  };

  const handleHeading = (val: string) => {
    if (!editor) return;
    if (val === "paragraph") { editor.chain().focus().setParagraph().run(); return; }
    const level = Number(val.replace("h", "")) as 1 | 2 | 3 | 4 | 5 | 6;
    editor.chain().focus().setHeading({ level }).run();
  };

  const Btn = ({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 items-center justify-center rounded px-2 text-sm transition-colors ${
        active ? "bg-purple-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-2">
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("write")}
          className={`px-3 py-1.5 text-sm font-medium rounded-t ${activeTab === "write" ? "bg-purple-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`px-3 py-1.5 text-sm font-medium rounded-t ${activeTab === "preview" ? "bg-purple-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
        >
          Preview
        </button>
      </div>

      {activeTab === "write" && editor ? (
        <div className="space-y-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 space-y-2">
            {/* Row 1: Typography */}
            <div className="flex flex-wrap gap-1.5">
              <select
                className="h-8 rounded border border-gray-200 bg-white px-2 text-xs"
                value={
                  editor.isActive("heading", { level: 1 }) ? "h1" :
                  editor.isActive("heading", { level: 2 }) ? "h2" :
                  editor.isActive("heading", { level: 3 }) ? "h3" :
                  editor.isActive("heading", { level: 4 }) ? "h4" : "paragraph"
                }
                onChange={(e) => handleHeading(e.target.value)}
              >
                <option value="paragraph">Paragraph</option>
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
                <option value="h4">Heading 4</option>
              </select>

              <select
                className="h-8 rounded border border-gray-200 bg-white px-2 text-xs"
                value={fontFamily}
                onChange={(e) => {
                  setFontFamily(e.target.value);
                  if (!editor) return;
                  if (e.target.value === "default") editor.chain().focus().unsetFontFamily().run();
                  else editor.chain().focus().setFontFamily(e.target.value).run();
                }}
              >
                {FONT_FAMILIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              <select
                className="h-8 rounded border border-gray-200 bg-white px-2 text-xs"
                value={fontSize}
                onChange={(e) => {
                  setFontSize(e.target.value);
                  if (!editor) return;
                  if (e.target.value === "default") editor.chain().focus().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run();
                  else editor.chain().focus().setMark("textStyle", { fontSize: e.target.value }).run();
                }}
              >
                {FONT_SIZES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              <div className="flex items-center gap-1 rounded border border-gray-200 bg-white px-2">
                <span className="text-[10px] font-medium text-gray-500">A</span>
                <input type="color" value={textColor} onChange={(e) => { setTextColor(e.target.value); editor.chain().focus().setColor(e.target.value).run(); }} className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0" />
              </div>

              <div className="flex items-center gap-1 rounded border border-gray-200 bg-white px-2">
                <span className="text-[10px] font-medium text-gray-500 bg-yellow-200 px-0.5">H</span>
                <input type="color" value={markColor} onChange={(e) => { setMarkColor(e.target.value); editor.chain().focus().setHighlight({ color: e.target.value }).run(); }} className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0" />
              </div>
            </div>

            {/* Row 2: Formatting */}
            <div className="flex flex-wrap gap-1">
              <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold className="h-4 w-4" /></Btn>
              <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Code2 className="h-4 w-4 -skew-x-12" /></Btn>
              <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><span className="text-sm font-bold underline">U</span></Btn>
              <Btn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><span className="text-sm line-through">S</span></Btn>
              <Btn active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline Code"><Code className="h-4 w-4" /></Btn>

              <div className="w-px bg-gray-300 mx-1" />

              <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List"><List className="h-4 w-4" /></Btn>
              <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered List"><ListOrdered className="h-4 w-4" /></Btn>
              <Btn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote"><Quote className="h-4 w-4" /></Btn>
              <Btn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code Block"><Code2 className="h-4 w-4" /></Btn>

              <div className="w-px bg-gray-300 mx-1" />

              <Btn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align Left"><AlignLeft className="h-4 w-4" /></Btn>
              <Btn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align Center"><AlignCenter className="h-4 w-4" /></Btn>
              <Btn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align Right"><AlignRight className="h-4 w-4" /></Btn>

              <div className="w-px bg-gray-300 mx-1" />

              <Btn onClick={handleSetLink} title="Insert Link"><Link2 className="h-4 w-4" /></Btn>
              <Btn onClick={handleInsertImage} title="Insert Image"><ImageIcon className="h-4 w-4" /></Btn>
              <Btn onClick={handleInsertVideo} title="Insert Video"><span className="text-xs">Video</span></Btn>
              <Btn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table"><span className="text-xs">Table</span></Btn>

              <div className="w-px bg-gray-300 mx-1" />

              <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 className="h-4 w-4" /></Btn>
              <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 className="h-4 w-4" /></Btn>
            </div>
          </div>

          <EditorContent editor={editor} />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      ) : activeTab === "write" ? (
        <div className="rounded-md border border-gray-200 bg-white px-4 py-8 text-sm text-gray-400">Loading editor...</div>
      ) : null}

      {activeTab === "preview" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          {value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-sm text-gray-400">Add content to preview the article.</p>
          )}
        </div>
      )}
    </div>
  );
}
