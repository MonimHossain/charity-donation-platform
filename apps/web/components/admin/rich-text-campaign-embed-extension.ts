import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CAMPAIGN_DONATION_EMBED_ATTR } from "@/lib/campaign-donation-embed";
import CampaignDonationEmbedNodeView from "./CampaignDonationEmbedNodeView";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    campaignDonationEmbed: {
      insertCampaignDonationEmbed: (attrs: { slug: string; title?: string }) => ReturnType;
    };
  }
}

export const CampaignDonationEmbedExtension = Node.create({
  name: "campaignDonationEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      slug: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-slug"),
        renderHTML: (attributes) => {
          if (!attributes.slug) return {};
          return { "data-slug": attributes.slug };
        },
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-title"),
        renderHTML: (attributes) => {
          if (!attributes.title) return {};
          return { "data-title": attributes.title };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: `div[${CAMPAIGN_DONATION_EMBED_ATTR}]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        [CAMPAIGN_DONATION_EMBED_ATTR]: "",
        class: "campaign-donation-embed",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CampaignDonationEmbedNodeView);
  },

  addCommands() {
    return {
      insertCampaignDonationEmbed:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs,
          }),
    };
  },
});
