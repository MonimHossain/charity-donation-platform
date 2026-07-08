"use client";

import { useMemo } from "react";
import sanitizeHtml from "sanitize-html";
import { HtmlVideo } from "@/components/blog/HtmlVideo";
import {
  isAllowedVideoEmbedSrc,
  normalizeRichHtmlForDisplay,
} from "@/lib/rich-html";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

type ContentPart =
  | { kind: "html"; html: string }
  | { kind: "video"; src: string; poster?: string; className?: string; style?: string }
  | { kind: "iframe"; src: string; title?: string };

const VIDEO_TAG_RE = /<video\b([^>]*?)\s*>(?:\s*<\/video>)?/gi;
const IFRAME_TAG_RE = /<iframe\b([^>]*?)\s*>(?:\s*<\/iframe>)?/gi;

function readAttr(attrs: string, name: string): string | undefined {
  const re = new RegExp(`\\s${name}\\s*=\\s*(["'])([^"']*)\\1`, "i");
  return attrs.match(re)?.[2];
}

function splitRichHtmlContent(html: string): ContentPart[] {
  const combined = /<(video|iframe)\b/gi;
  const parts: ContentPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combined.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const start = match.index;
    if (start > lastIndex) {
      parts.push({ kind: "html", html: html.slice(lastIndex, start) });
    }

    const tagRe = tag === "video" ? VIDEO_TAG_RE : IFRAME_TAG_RE;
    tagRe.lastIndex = start;
    const tagMatch = tagRe.exec(html);
    if (!tagMatch) {
      lastIndex = start + match[0].length;
      continue;
    }

    const attrString = tagMatch[1] ?? "";
    const src = readAttr(attrString, "src");
    if (tag === "video" && src) {
      parts.push({
        kind: "video",
        src,
        poster: readAttr(attrString, "poster"),
        className: readAttr(attrString, "class"),
        style: readAttr(attrString, "style"),
      });
    } else if (tag === "iframe" && src && isAllowedVideoEmbedSrc(src)) {
      parts.push({
        kind: "iframe",
        src,
        title: readAttr(attrString, "title"),
      });
    } else {
      parts.push({ kind: "html", html: tagMatch[0] });
    }

    lastIndex = tagRe.lastIndex;
    combined.lastIndex = lastIndex;
  }

  if (lastIndex < html.length) {
    parts.push({ kind: "html", html: html.slice(lastIndex) });
  }

  return parts.length ? parts : [{ kind: "html", html }];
}

function sanitizeRichHtmlFragment(html: string): string {
  return sanitizeHtml(html || "", {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "del",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "img",
      "figure",
      "figcaption",
      "mark",
      "pre",
      "code",
      "s",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "hr",
      "span",
      "u",
      "source",
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "style", "class"],
      source: ["src", "type"],
      span: ["style", "class"],
      mark: ["style", "data-color", "class"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      h5: ["style"],
      h6: ["style"],
      p: ["style"],
      th: ["style"],
      td: ["style"],
      blockquote: ["style"],
      li: ["style"],
      "*": ["class"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
        width: [/^\d+(?:\.\d+)?px$/, /^100%$/],
        height: [/^\d+(?:\.\d+)?px$/, /^auto$/],
        color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(.+\)$/, /^rgba\(.+\)$/],
        "font-size": [/^\d+(?:\.\d+)?px$/],
        "font-family": [/^[a-zA-Z0-9\s,"'-]+$/],
        "background-color": [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(.+\)$/, /^rgba\(.+\)$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
      source: ["http", "https"],
    },
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || "";
        const isExternal = href.startsWith("http");
        const nextAttribs = { ...attribs };
        if (isExternal) {
          nextAttribs.target = "_blank";
          nextAttribs.rel = "noreferrer";
        }
        return { tagName, attribs: nextAttribs };
      },
    },
  });
}

const proseClasses = [
  "blog-content max-w-full overflow-x-hidden break-words text-[17px] leading-[1.88] text-gray-700",
  "[&_h1]:mt-10 [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:text-gray-900 [&_h1]:break-words",
  "[&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:text-gray-900 [&_h2]:break-words",
  "[&_h3]:mt-8 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:text-gray-900 [&_h3]:break-words",
  "[&_h4]:mt-7 [&_h4]:text-xl [&_h4]:font-semibold [&_h4]:text-gray-900 [&_h4]:break-words",
  "[&_p]:mt-5 [&_p]:text-[17px] [&_p]:leading-[1.88] [&_p]:text-gray-600 [&_p]:break-words",
  "[&_strong]:font-semibold [&_strong]:text-gray-900",
  "[&_em]:italic [&_em]:text-gray-500",
  "[&_u]:underline [&_s]:line-through [&_del]:line-through",
  "[&_mark]:rounded-sm [&_mark]:px-0.5",
  "[&_a]:font-medium [&_a]:text-purple-700 [&_a]:underline [&_a]:underline-offset-4 [&_a]:break-all",
  "[&_blockquote]:mt-8 [&_blockquote]:border-l-4 [&_blockquote]:border-purple-300 [&_blockquote]:bg-purple-50 [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:italic [&_blockquote]:text-gray-600",
  "[&_ul]:mt-5 [&_ul]:list-disc [&_ul]:space-y-3 [&_ul]:pl-6",
  "[&_ol]:mt-5 [&_ol]:list-decimal [&_ol]:space-y-3 [&_ol]:pl-6",
  "[&_li]:pl-1 [&_li]:text-[17px] [&_li]:leading-[1.82] [&_li]:text-gray-600 [&_li]:break-words",
  "[&_hr]:my-10 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-gray-200",
  "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:border [&_img]:border-gray-200",
  "[&_p_img]:my-1 [&_p_img]:inline-block [&_p_img]:align-middle [&_p_img]:rounded-md",
  "[&_p_img]:border-0",
  "[&_img.rte-inline-image]:inline-block [&_img.rte-inline-image]:align-middle [&_img.rte-inline-image]:border-0",
  "[&_figure]:my-8 [&_figure]:max-w-full",
  "[&_figcaption]:mt-3 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-gray-500",
  "[&_pre]:mt-6 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-gray-900 [&_pre]:p-5 [&_pre]:text-sm [&_pre]:leading-relaxed [&_pre]:text-white",
  "[&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.95em] [&_code]:text-purple-700 [&_code]:break-all",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-white",
  "[&_table]:my-8 [&_table]:w-full [&_table]:max-w-full [&_table]:table-fixed [&_table]:border-collapse [&_table]:rounded-xl",
  "[&_thead]:bg-gray-50",
  "[&_th]:border [&_th]:border-gray-200 [&_th]:px-3 [&_th]:py-3 [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-gray-600 [&_th]:break-words",
  "[&_td]:border [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-3 [&_td]:text-[15px] [&_td]:text-gray-600 [&_td]:break-words",
  "[&_iframe]:max-w-full",
  "[&_video]:max-w-full",
].join(" ");

function inlineStyleFromAttr(style?: string): React.CSSProperties | undefined {
  if (!style?.trim()) return undefined;
  const out: React.CSSProperties = {};
  for (const chunk of style.split(";")) {
    const [rawKey, rawVal] = chunk.split(":");
    if (!rawKey || !rawVal) continue;
    const key = rawKey.trim();
    const val = rawVal.trim();
    if (key === "width") out.width = val;
    else if (key === "height") out.height = val;
  }
  return Object.keys(out).length ? out : undefined;
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const parts = useMemo(() => {
    const normalized = normalizeRichHtmlForDisplay(content || "");
    return splitRichHtmlContent(normalized).map((part) => {
      if (part.kind !== "html") return part;
      const sanitized = sanitizeRichHtmlFragment(part.html);
      return sanitized.trim() ? { ...part, html: sanitized } : null;
    }).filter(Boolean) as ContentPart[];
  }, [content]);

  return (
    <div className={`${proseClasses} ${className || ""}`}>
      {parts.map((part, index) => {
        if (part.kind === "video") {
          return (
            <HtmlVideo
              key={`video-${index}-${part.src}`}
              src={part.src}
              poster={part.poster}
              className={part.className}
              style={inlineStyleFromAttr(part.style)}
            />
          );
        }
        if (part.kind === "iframe") {
          return (
            <div key={`iframe-${index}`} className="my-8 aspect-video w-full overflow-hidden rounded-xl border border-gray-200">
              <iframe
                src={part.src}
                title={part.title || "Embedded video"}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          );
        }
        return (
          <div
            key={`html-${index}`}
            dangerouslySetInnerHTML={{ __html: part.html }}
          />
        );
      })}
    </div>
  );
}
