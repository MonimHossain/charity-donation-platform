import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import {
  IMAGE_SLIDER_ATTR,
  IMAGE_SLIDER_IMAGES_ATTR,
  parseImageUrlsFromSliderTag,
} from "@/lib/image-slider-embed";
import ImageSliderNodeView from "./ImageSliderNodeView";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageSlider: {
      insertImageSlider: (attrs: { images: string[] }) => ReturnType;
    };
  }
}

function parseImagesAttribute(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  } catch {
    const fakeTag = `<div ${IMAGE_SLIDER_IMAGES_ATTR}="${value}"></div>`;
    return parseImageUrlsFromSliderTag(fakeTag);
  }
}

export const ImageSliderExtension = Node.create({
  name: "imageSlider",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      images: {
        default: [] as string[],
        parseHTML: (element) => {
          const raw = element.getAttribute(IMAGE_SLIDER_IMAGES_ATTR);
          return parseImagesAttribute(raw);
        },
        renderHTML: (attributes) => {
          const images = Array.isArray(attributes.images) ? attributes.images : [];
          if (images.length === 0) return {};
          const json = JSON.stringify(images);
          return { [IMAGE_SLIDER_IMAGES_ATTR]: json };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: `div[${IMAGE_SLIDER_ATTR}]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        [IMAGE_SLIDER_ATTR]: "",
        class: "image-slider-embed",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageSliderNodeView);
  },

  addCommands() {
    return {
      insertImageSlider:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { images: attrs.images },
          }),
    };
  },
});
