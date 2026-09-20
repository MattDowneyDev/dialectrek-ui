import { test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("../../../../../features/grammar/GrammarTopicDetail", () => ({
  default: ({ topic }: { topic: { slug: string } }) => (
    <div data-testid="grammar-topic-detail">{topic.slug}</div>
  ),
}));

const { notFound } = await import("next/navigation");
const { default: GrammarTopicPage, generateMetadata, generateStaticParams } = await import(
  "../page"
);

beforeEach(() => {
  vi.mocked(notFound).mockClear();
});

test("renders the topic detail and breadcrumb JSON-LD for a real topic", async () => {
  const element = await GrammarTopicPage({
    params: Promise.resolve({ language: "es", topic: "preterite-vs-imperfect" }),
  });
  render(element);
  expect(screen.getByTestId("grammar-topic-detail")).toHaveTextContent(
    "preterite-vs-imperfect",
  );
  expect(notFound).not.toHaveBeenCalled();
  const script = document.querySelector('script[type="application/ld+json"]');
  expect(script).not.toBeNull();
  const jsonLd = JSON.parse(script?.innerHTML ?? "{}");
  expect(jsonLd["@type"]).toBe("BreadcrumbList");
  expect(jsonLd.itemListElement).toHaveLength(4);
});

test("calls notFound for a topic that doesn't exist", async () => {
  await expect(
    GrammarTopicPage({ params: Promise.resolve({ language: "es", topic: "not-a-topic" }) }),
  ).rejects.toThrow("NEXT_NOT_FOUND");
  expect(notFound).toHaveBeenCalled();
});

test("returns null for an unknown language before checking the topic", async () => {
  const element = await GrammarTopicPage({
    params: Promise.resolve({ language: "de", topic: "anything" }),
  });
  expect(element).toBeNull();
  expect(notFound).not.toHaveBeenCalled();
});

test("generates metadata for a real topic", async () => {
  const metadata = await generateMetadata({
    params: Promise.resolve({ language: "es", topic: "preterite-vs-imperfect" }),
  });
  expect(metadata.alternates?.canonical).toBe("/es/grammar/preterite-vs-imperfect");
});

test("returns empty metadata for a topic that doesn't exist", async () => {
  const metadata = await generateMetadata({
    params: Promise.resolve({ language: "es", topic: "not-a-topic" }),
  });
  expect(metadata).toEqual({});
});

test("generates static params for every enabled language's grammar topics", async () => {
  const params = await generateStaticParams();
  expect(params.length).toBeGreaterThan(0);
  expect(params).toContainEqual({ language: "es", topic: "preterite-vs-imperfect" });
});
