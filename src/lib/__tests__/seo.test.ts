import { describe, expect, test } from "vitest";
import { pageMetadata } from "../seo";

describe("pageMetadata", () => {
  test("defaults ogTitle to '<title> | DialecTrek' when not given", () => {
    const metadata = pageMetadata({
      title: "Learn Spanish",
      description: "desc",
      path: "/es",
    });
    expect(metadata.title).toBe("Learn Spanish");
    expect(metadata.openGraph?.title).toBe("Learn Spanish | DialecTrek");
    expect(metadata.twitter?.title).toBe("Learn Spanish | DialecTrek");
  });

  test("uses an explicit ogTitle instead of the default when provided", () => {
    const metadata = pageMetadata({
      title: "DialecTrek",
      ogTitle: "DialecTrek",
      description: "desc",
      path: "/",
    });
    expect(metadata.openGraph?.title).toBe("DialecTrek");
    expect(metadata.twitter?.title).toBe("DialecTrek");
  });

  test("sets the canonical link and openGraph url from path", () => {
    const metadata = pageMetadata({ title: "t", description: "d", path: "/es/verbs" });
    expect(metadata.alternates?.canonical).toBe("/es/verbs");
    expect(metadata.openGraph?.url).toBe("/es/verbs");
  });

  test("includes a default social preview image on both card types", () => {
    const metadata = pageMetadata({ title: "t", description: "d", path: "/" });
    expect(metadata.openGraph?.images).toEqual([
      { url: "/DialecTrekHeroImage.png", alt: expect.any(String) },
    ]);
    expect(metadata.twitter?.images).toEqual([
      { url: "/DialecTrekHeroImage.png", alt: expect.any(String) },
    ]);
    // pageMetadata always sets a card, but next's Twitter type is a union
    // whose bare fallback member has no `card` field, so TS won't let us
    // read it without narrowing past that union first.
    expect((metadata.twitter as Record<string, unknown> | null)?.card).toBe(
      "summary_large_image",
    );
  });
});
