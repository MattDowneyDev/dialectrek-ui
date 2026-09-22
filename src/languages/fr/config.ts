import type { Tense, TenseExample } from "../types";
import type { LanguageDefinition } from "../registry";
import { frGrammarTopics, frUpcomingGrammarTopics } from "./grammar";

export const fr: LanguageDefinition = {
  code: "fr",
  displayName: "French",
  flagEmoji: "🇫🇷",
  enabled: true,
  // present, imperfect, perfect, pluperfect, future, future perfect,
  // conditional, and conditional perfect are all indicative-only so
  // far; present and perfect also have their subjunctive built
  // (le subjonctif / le subjonctif passé), plus the imperative --
  // everything else 422s until it gets an engine too.
  hasVerbs: true,
  hasWatch: true,
  verbCount: 100,
  wordCount: 2000,
  tenseLabels: {
    present: "Present",
    preterite: "Preterite",
    imperfect: "Imperfect",
    // "perfect" is the same slot Spanish's "Present Perfect" (haber +
    // participle) occupies -- avoir/être + participle here -- but French
    // doesn't call it that, so it gets its own name for this language.
    perfect: "Passé Composé",
    future: "Future",
    future_perfect: "Future Perfect",
    conditional: "Conditional",
    conditional_perfect: "Conditional Perfect",
    preterite_perfect: "Preterite Perfect",
    pluperfect: "Pluperfect",
    imperative: "Imperative",
  } satisfies Record<Tense, string>,
  // "parler" (regular -er verb) in first person singular ("je"), except
  // the imperative -- which has no "je" form -- shown as the informal
  // "tu" command instead. preterite/preterite_perfect (the literary
  // passé simple/passé antérieur) aren't offered in availableTenses, but
  // still get an example here since tenseLabels covers every Tense too.
  tenseExamples: {
    present: { target: "Je parle", english: "I speak" },
    preterite: { target: "Je parlai", english: "I spoke" },
    imperfect: { target: "Je parlais", english: "I was speaking" },
    perfect: { target: "J'ai parlé", english: "I have spoken" },
    future: { target: "Je parlerai", english: "I will speak" },
    future_perfect: { target: "J'aurai parlé", english: "I will have spoken" },
    conditional: { target: "Je parlerais", english: "I would speak" },
    conditional_perfect: { target: "J'aurais parlé", english: "I would have spoken" },
    preterite_perfect: { target: "J'eus parlé", english: "I had spoken" },
    pluperfect: { target: "J'avais parlé", english: "I had spoken" },
    imperative: { target: "Parle !", english: "Speak!" },
  } satisfies Record<Tense, TenseExample>,
  availableTenses: [
    "present", "imperfect", "perfect", "pluperfect", "future", "future_perfect",
    "conditional", "conditional_perfect", "imperative",
  ],
  // imperfect/pluperfect subjunctive exist in French but are archaic
  // literary tenses (like the preterite), so they're not built -- these
  // stay indicative-only until they are. conditional has no subjunctive
  // form at all, in French or in this app's model.
  indicativeOnlyTenses: ["imperfect", "pluperfect", "future", "future_perfect", "conditional", "conditional_perfect"],
  hasSubjunctive: true,
  accentChars: ["à", "â", "ç", "é", "è", "ê", "î", "ï", "ô", "û", "ù", "œ"],
  extraToggles: [],
  grammarTopics: frGrammarTopics,
  upcomingGrammarTopics: frUpcomingGrammarTopics,
};
