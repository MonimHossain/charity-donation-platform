"use client";

import sanitizeHtml from "sanitize-html";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const sanitized = sanitizeHtml(content || "", {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "del", "h1", "h2", "h3", "h4", "h5", "h6",
      "img", "figure", "figcaption", "mark", "pre", "code", "s",
      "table", "thead", "tbody", "tr", "th", "td", "hr", "span", "u",
      "video", "source",
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "style"],
      video: ["src", "controls", "poster", "preload", "class", "width", "height", "style"],
      source: ["src", "type"],
      h1: ["style"], h2: ["style"], h3: ["style"], h4: ["style"], h5: ["style"], h6: ["style"],
      p: ["style"], th: ["style"], td: ["style"],
      "*": ["class"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
        width: [/^\d+(?:\.\d+)?px$/, /^100%$/],
        height: [/^\d+(?:\.\d+)?px$/, /^auto$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
      video: ["http", "https"],
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

  const base = [
    "blog-content max-w-full overflow-x-auto text-[17px] leading-[1.88] text-gray-700",
    "[&_h1]:mt-10 [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:text-gray-900",
    "[&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:text-gray-900",
    "[&_h3]:mt-8 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:text-gray-900",
    "[&_h4]:mt-7 [&_h4]:text-xl [&_h4]:font-semibold [&_h4]:text-gray-900",
    "[&_p]:mt-5 [&_p]:text-[17px] [&_p]:leading-[1.88] [&_p]:text-gray-600",
    "[&_strong]:font-semibold [&_strong]:text-gray-900",
    "[&_em]:italic [&_em]:text-gray-500",
    "[&_a]:font-medium [&_a]:text-purple-700 [&_a]:underline [&_a]:underline-offset-4",
    "[&_blockquote]:mt-8 [&_blockquote]:border-l-4 [&_blockquote]:border-purple-300 [&_blockquote]:bg-purple-50 [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:italic [&_blockquote]:text-gray-600",
    "[&_ul]:mt-5 [&_ul]:list-disc [&_ul]:space-y-3 [&_ul]:pl-6",
    "[&_ol]:mt-5 [&_ol]:list-decimal [&_ol]:space-y-3 [&_ol]:pl-6",
    "[&_li]:pl-1 [&_li]:text-[17px] [&_li]:leading-[1.82] [&_li]:text-gray-600",
    "[&_hr]:my-10 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-gray-200",
    "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:border [&_img]:border-gray-200",
    "[&_p_img]:my-1 [&_p_img]:inline-block [&_p_img]:align-middle [&_p_img]:rounded-md",
    "[&_p_img]:border-0",
    "[&_video]:my-8 [&_video]:max-w-full [&_video]:rounded-xl [&_video]:border [&_video]:border-gray-200",
    "[&_figure]:my-8",
    "[&_figcaption]:mt-3 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-gray-500",
    "[&_pre]:mt-6 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-gray-900 [&_pre]:p-5 [&_pre]:text-sm [&_pre]:leading-relaxed [&_pre]:text-white",
    "[&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.95em] [&_code]:text-purple-700",
    "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-white",
    "[&_table]:my-8 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-xl",
    "[&_thead]:bg-gray-50",
    "[&_th]:border [&_th]:border-gray-200 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-gray-600",
    "[&_td]:border [&_td]:border-gray-200 [&_td]:px-4 [&_td]:py-3 [&_td]:text-[15px] [&_td]:text-gray-600",
  ].join(" ");

  return (
    <div
      className={`${base} ${className || ""}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
