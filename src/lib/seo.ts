import type { Metadata } from "next";

const DEFAULT_IMAGE = "/DialecTrekHeroImage.jpeg";
const DEFAULT_IMAGE_ALT =
  "A hiker pauses on a mountain trail, looking out over green valleys and a winding path toward distant peaks";

type PageMetadataInput = {
  /** Page-specific title. Runs through the root layout's "%s | DialecTrek" template. */
  title: string;
  /**
   * Literal title for OpenGraph/Twitter cards, which don't receive the
   * template. Defaults to `${title} | DialecTrek`; pass this explicitly
   * when `title` is itself the full, final title (e.g. the homepage).
   */
  ogTitle?: string;
  description: string;
  /** Site-relative path, e.g. "/es/verbs". */
  path: string;
};

/**
 * Builds a full Metadata object -- title/description plus the matching
 * OpenGraph, Twitter card, and canonical URL -- so every route gets social
 * previews and a canonical link without repeating the same three blocks.
 */
export const pageMetadata = ({
  title,
  ogTitle,
  description,
  path,
}: PageMetadataInput): Metadata => {
  const resolvedOgTitle = ogTitle ?? `${title} | DialecTrek`;
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: resolvedOgTitle,
      description,
      url: path,
      type: "website",
      images: [{ url: DEFAULT_IMAGE, alt: DEFAULT_IMAGE_ALT }],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedOgTitle,
      description,
      images: [{ url: DEFAULT_IMAGE, alt: DEFAULT_IMAGE_ALT }],
    },
  };
};
