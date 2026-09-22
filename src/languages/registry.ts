import type { GrammarTopic, GrammarTopicPreview, Tense, TenseExample } from "./types";
import { es } from "./es/config";
import { fr } from "./fr/config";

export type LanguageDefinition = {
  code: string;
  displayName: string;
  flagEmoji: string;
  enabled: boolean;
  // Verb conjugation is only built out for some languages so far (each one
  // needs its own rule engine) -- languages with hasVerbs: false still get
  // flashcards, but the verbs/conjugate routes and nav links are hidden.
  hasVerbs: boolean;
  // Whether the prod DB actually has videos for this language yet -- the
  // watch route falls back to ComingSoon while it's false, same as the
  // grammar/verbs routes do for their own missing content.
  hasWatch: boolean;
  verbCount: number;
  wordCount: number;
  tenseLabels: Record<Tense, string>;
  // One regular verb, conjugated the same way in every tense (see
  // TenseExample), shown alongside tenseLabels on the tense picker.
  tenseExamples: Record<Tense, TenseExample>;
  // Which tenses this language's conjugation engine actually supports --
  // narrower than tenseLabels' keys while a language is still being built
  // out, so the practice setup only ever offers tenses that won't 422.
  availableTenses: Tense[];
  indicativeOnlyTenses: Tense[];
  hasSubjunctive: boolean;
  accentChars: string[];
  extraToggles: { key: string; prompt: string }[];
  // Explanatory grammar concept pages -- hand-authored per language, so
  // this is empty (rather than absent) for a language that isn't built
  // out yet; the grammar routes fall back to ComingSoon in that case.
  grammarTopics: GrammarTopic[];
  // Topics on the roadmap but not written yet -- rendered as inactive
  // rows on the grammar list page so it reflects the full plan, not just
  // what's shipped.
  upcomingGrammarTopics: GrammarTopicPreview[];
};

export const LANGUAGES: Record<string, LanguageDefinition> = { es, fr };
