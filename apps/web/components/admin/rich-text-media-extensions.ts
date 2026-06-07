import TipTapImage from "@tiptap/extension-image";
import { Node, mergeAttributes, ResizableNodeView } from "@tiptap/core";

export const MEDIA_RESIZE = {
  directions: ["bottom-left", "bottom-right", "top-left", "top-right"] as const,
  minWidth: 80,
  minHeight: 60,
  alwaysPreserveAspectRatio: true,
};

type ResizeDirection = (typeof MEDIA_RESIZE.directions)[number];

const HANDLE_POSITIONS: Record<
  ResizeDirection,
  { top?: string; right?: string; bottom?: string; left?: string; cursor: string }
> = {
  "top-left": { top: "0", left: "0", cursor: "nwse-resize" },
  "top-right": { top: "0", right: "0", cursor: "nesw-resize" },
  "bottom-left": { bottom: "0", left: "0", cursor: "nesw-resize" },
  "bottom-right": { bottom: "0", right: "0", cursor: "nwse-resize" },
};

/** Visible corner handles — TipTap's default handles are invisible without custom styling. */
export function createMediaResizeHandle(direction: ResizeDirection): HTMLElement {
  const handle = document.createElement("div");
  handle.dataset.resizeHandle = direction;
  handle.className = "rte-resize-handle";
  handle.title = "Drag to resize";

  const pos = HANDLE_POSITIONS[direction];
  handle.style.position = "absolute";
  handle.style.width = "14px";
  handle.style.height = "14px";
  handle.style.background = "#9333ea";
  handle.style.border = "2px solid #ffffff";
  handle.style.borderRadius = "9999px";
  handle.style.boxShadow = "0 1px 4px rgba(0, 0, 0, 0.35)";
  handle.style.zIndex = "30";
  handle.style.pointerEvents = "auto";
  handle.style.cursor = pos.cursor;
  if (pos.top) handle.style.top = pos.top;
  if (pos.right) handle.style.right = pos.right;
  if (pos.bottom) handle.style.bottom = pos.bottom;
  if (pos.left) handle.style.left = pos.left;

  const transform =
    direction === "top-left"
      ? "translate(-50%, -50%)"
      : direction === "top-right"
        ? "translate(50%, -50%)"
        : direction === "bottom-left"
          ? "translate(-50%, 50%)"
          : "translate(50%, 50%)";
  handle.style.transform = transform;

  return handle;
}

function buildResizableNodeViewOptions() {
  return {
    directions: [...MEDIA_RESIZE.directions],
    min: { width: MEDIA_RESIZE.minWidth, height: MEDIA_RESIZE.minHeight },
    preserveAspectRatio: MEDIA_RESIZE.alwaysPreserveAspectRatio,
    createCustomHandle: (direction: string) =>
      createMediaResizeHandle(direction as ResizeDirection),
  };
}

function revealWhenReady(container: HTMLElement, onReady: () => void) {
  container.style.visibility = "hidden";
  container.style.pointerEvents = "none";
  onReady();
  container.style.visibility = "";
  container.style.pointerEvents = "";
}

export const ResizableImage = TipTapImage.extend({
  addNodeView() {
    if (!this.options.resize?.enabled || typeof document === "undefined") {
      return null;
    }

    const nodeType = this.name;

    return ({ node, getPos, HTMLAttributes, editor }) => {
      const el = document.createElement("img");
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (value == null || key === "width" || key === "height") return;
        el.setAttribute(key, String(value));
      });
      el.src = HTMLAttributes.src;
      el.className = "my-3 rounded-lg max-w-full block";
      if (HTMLAttributes.width) el.style.width = `${HTMLAttributes.width}px`;
      if (HTMLAttributes.height) el.style.height = `${HTMLAttributes.height}px`;

      const nodeView = new ResizableNodeView({
        element: el,
        editor,
        node,
        getPos,
        onResize: (width, height) => {
          el.style.width = `${width}px`;
          el.style.height = `${height}px`;
        },
        onCommit: (width, height) => {
          const pos = getPos();
          if (pos === undefined) return;
          editor.chain().setNodeSelection(pos).updateAttributes(nodeType, { width, height }).run();
        },
        onUpdate: (updatedNode) => {
          if (updatedNode.type !== node.type) return false;
          if (updatedNode.attrs.src !== node.attrs.src) {
            el.src = updatedNode.attrs.src;
          }
          if (updatedNode.attrs.width) el.style.width = `${updatedNode.attrs.width}px`;
          if (updatedNode.attrs.height) el.style.height = `${updatedNode.attrs.height}px`;
          return true;
        },
        options: buildResizableNodeViewOptions(),
      });

      const dom = nodeView.dom as HTMLElement;
      const reveal = () => revealWhenReady(dom, () => undefined);
      if (el.complete) reveal();
      else {
        el.onload = reveal;
        el.onerror = reveal;
      }

      return nodeView;
    };
  },
});

export const ResizableVideo = Node.create({
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
      width: { default: null },
      height: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "video[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    const { width, height, ...rest } = HTMLAttributes;
    const styleParts = [];
    if (width) styleParts.push(`width:${width}px`);
    if (height) styleParts.push(`height:${height}px`);
    if (!width) styleParts.push("width:100%");
    if (!height) styleParts.push("height:auto");

    return [
      "video",
      mergeAttributes(rest, {
        class: "my-3 rounded-lg max-w-full",
        style: styleParts.join(";"),
        controls: HTMLAttributes.controls === false ? undefined : "true",
        preload: HTMLAttributes.preload || "metadata",
        width: width ?? undefined,
        height: height ?? undefined,
      }),
    ];
  },
  addNodeView() {
    if (typeof document === "undefined") return null;

    return ({ node, getPos, HTMLAttributes, editor }) => {
      const el = document.createElement("video");
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (value == null || key === "width" || key === "height") return;
        if (key === "controls") {
          if (value !== false) el.setAttribute("controls", "true");
          return;
        }
        el.setAttribute(key, String(value));
      });
      el.src = HTMLAttributes.src;
      el.className = "my-3 rounded-lg max-w-full block";
      el.controls = true;
      if (HTMLAttributes.width) el.style.width = `${HTMLAttributes.width}px`;
      if (HTMLAttributes.height) el.style.height = `${HTMLAttributes.height}px`;

      const nodeView = new ResizableNodeView({
        element: el,
        editor,
        node,
        getPos,
        onResize: (width, height) => {
          el.style.width = `${width}px`;
          el.style.height = `${height}px`;
        },
        onCommit: (width, height) => {
          const pos = getPos();
          if (pos === undefined) return;
          editor.chain().setNodeSelection(pos).updateAttributes("video", { width, height }).run();
        },
        onUpdate: (updatedNode) => {
          if (updatedNode.type !== node.type) return false;
          if (updatedNode.attrs.src !== node.attrs.src) {
            el.src = updatedNode.attrs.src;
          }
          if (updatedNode.attrs.width) el.style.width = `${updatedNode.attrs.width}px`;
          if (updatedNode.attrs.height) el.style.height = `${updatedNode.attrs.height}px`;
          return true;
        },
        options: buildResizableNodeViewOptions(),
      });

      const dom = nodeView.dom as HTMLElement;
      const reveal = () => revealWhenReady(dom, () => undefined);
      if (el.readyState >= 1) reveal();
      else el.addEventListener("loadedmetadata", reveal, { once: true });

      return nodeView;
    };
  },
});
