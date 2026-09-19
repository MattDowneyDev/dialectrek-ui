import { describe, expect, test } from "vitest";
import { LANGUAGES } from "../registry";

describe("LANGUAGES", () => {
  test("registers both es and fr under their own language code", () => {
    expect(LANGUAGES.es.code).toBe("es");
    expect(LANGUAGES.fr.code).toBe("fr");
  });

  test("every registered language has a non-empty display name and flag", () => {
    for (const definition of Object.values(LANGUAGES)) {
      expect(definition.displayName.length).toBeGreaterThan(0);
      expect(definition.flagEmoji.length).toBeGreaterThan(0);
    }
  });

  test("availableTenses is a subset of the tenses that have labels", () => {
    for (const definition of Object.values(LANGUAGES)) {
      for (const tense of definition.availableTenses) {
        expect(definition.tenseLabels).toHaveProperty(tense);
      }
    }
  });

  test("indicativeOnlyTenses is a subset of availableTenses", () => {
    for (const definition of Object.values(LANGUAGES)) {
      for (const tense of definition.indicativeOnlyTenses) {
        expect(definition.availableTenses).toContain(tense);
      }
    }
  });

  test("upcomingGrammarTopics doesn't duplicate an already-written grammarTopics title", () => {
    for (const definition of Object.values(LANGUAGES)) {
      const writtenTitles = new Set(definition.grammarTopics.map((t) => t.title));
      for (const upcoming of definition.upcomingGrammarTopics) {
        expect(writtenTitles.has(upcoming.title)).toBe(false);
      }
    }
  });
});
