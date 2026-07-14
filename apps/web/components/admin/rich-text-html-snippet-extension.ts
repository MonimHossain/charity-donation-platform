import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import {
  HTML_SNIPPET_ATTR,
  HTML_SNIPPET_B64_ATTR,
  HTML_SNIPPET_LABEL_ATTR,
  decodeHtmlSnippetPayload,
  encodeHtmlSnippetPayload,
} from "@/lib/html-snippet-embed";
import HtmlSnippetNodeView from "./HtmlSnippetNodeView";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    htmlSnippet: {
      insertHtmlSnippet: (attrs: { html: string; label?: string }) => ReturnType;
    };
  }
}

export const HtmlSnippetExtension = Node.create({
  name: "htmlSnippet",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      html: {
        default: "",
        parseHTML: (element) => {
          const b64 = element.getAttribute(HTML_SNIPPET_B64_ATTR);
          return b64 ? decodeHtmlSnippetPayload(b64) : "";
        },
        renderHTML: () => ({}),
      },
      label: {
        default: "HTML snippet",
        parseHTML: (element) => element.getAttribute(HTML_SNIPPET_LABEL_ATTR) || "HTML snippet",
        renderHTML: (attributes) => {
          if (!attributes.label) return {};
          return { [HTML_SNIPPET_LABEL_ATTR]: attributes.label };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: `div[${HTML_SNIPPET_ATTR}]` }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const html = String(node.attrs.html || "");
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        [HTML_SNIPPET_ATTR]: "",
        [HTML_SNIPPET_B64_ATTR]: encodeHtmlSnippetPayload(html),
        class: "html-snippet-embed",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(HtmlSnippetNodeView);
  },

  addCommands() {
    return {
      insertHtmlSnippet:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              html: attrs.html,
              label: attrs.label?.trim() || "HTML snippet",
            },
          }),
    };
  },
});
