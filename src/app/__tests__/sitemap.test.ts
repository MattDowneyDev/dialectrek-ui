import { test, expect, vi } from "vitest";

const fetchAllVerbsMock = vi.fn();

vi.mock("../../languages/api", () => ({
  fetchAllVerbs: fetchAllVerbsMock,
}));

const { default: sitemap } = await import("../sitemap");

test("includes the home and privacy pages plus every enabled language's routes", async () => {
  fetchAllVerbsMock.mockResolvedValue([["hablar", "to speak"]]);
  const entries = await sitemap();

  const urls = entries.map((entry) => entry.url);
  expect(urls).toContain("http://localhost:3000");
  expect(urls).toContain("http://localhost:3000/privacy");
  expect(urls).toContain("http://localhost:3000/es");
  expect(urls).toContain("http://localhost:3000/es/verbs");
  expect(urls).toContain("http://localhost:3000/es/conjugate");
  expect(urls).toContain("http://localhost:3000/es/flashcards");
  expect(urls).toContain("http://localhost:3000/es/watch");
  expect(urls).toContain("http://localhost:3000/es/grammar");
  expect(urls).toContain("http://localhost:3000/es/about");
  expect(urls).toContain("http://localhost:3000/es/grammar/preterite-vs-imperfect");
  expect(urls).toContain(
    `http://localhost:3000/es/verbs/${encodeURIComponent("hablar")}`,
  );
});

test("omits verb pages when the backend fetch throws", async () => {
  fetchAllVerbsMock.mockRejectedValue(new Error("backend unreachable"));
  const entries = await sitemap();
  const verbUrls = entries.filter((entry) => entry.url.includes("/es/verbs/"));
  expect(verbUrls).toEqual([]);
});
