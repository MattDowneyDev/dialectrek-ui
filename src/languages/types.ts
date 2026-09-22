export type Mood = "indicative" | "subjunctive";

export type Tense =
  | "present"
  | "preterite"
  | "imperfect"
  | "perfect"
  | "future"
  | "future_perfect"
  | "conditional"
  | "conditional_perfect"
  | "preterite_perfect"
  | "pluperfect"
  | "imperative";

export type Polarity = "affirmative" | "negative";

// A quick, always-regular illustration of what a tense actually looks
// like (e.g. Spanish "hablar"/French "parler" -- first person singular,
// or an imperative form for the tenses that don't have one) -- shown
// under that tense's name on the tense-picker screen so a learner isn't
// choosing "Pluperfect" from the name alone.
export type TenseExample = {
  target: string;
  english: string;
};

export type VerbEntry = [string, string];

export type VerbConjugation = {
  form_english?: string;
  form_target?: string;
  form_target_alt?: string | null;
  pronoun_english?: string;
  infinitive_target?: string;
  mood?: Mood;
  tense?: Tense;
  polarity?: Polarity;
};

export type PronounConjugation = {
  pronoun_target: string;
  pronoun_english: string;
  form_target: string;
  form_target_alt?: string | null;
  form_english: string;
};

export type VerbConjugationTable = {
  infinitive_target: string;
  infinitive_english: string;
  mood: Mood;
  tense: Tense;
  conjugations: PronounConjugation[];
};

// The imperative has no single "mood"-like axis to pick a form with --
// affirmative and negative are both worth seeing side by side, so this
// shape carries both instead of the usual single form_target/form_english.
export type ImperativeConjugation = {
  pronoun_target: string;
  pronoun_english: string;
  form_target_affirmative: string;
  form_target_negative: string;
  form_english_affirmative: string;
  form_english_negative: string;
};

export type ImperativeConjugationTable = {
  infinitive_target: string;
  infinitive_english: string;
  tense: "imperative";
  conjugations: ImperativeConjugation[];
};

export type RandomWord = {
  rank: number;
  word_target: string;
  word_english: string;
  category: string;
};

// Grammar concept pages are hand-authored explanatory content (unlike
// verbs/words, which come from the API) -- these types back a generic
// two-way comparison ("tone a" vs "tone b", e.g. preterite vs imperfect,
// or ser vs estar for a future topic) so the same detail page layout can
// render any topic shaped that way.
export type GrammarTextPart = { text: string; tone?: "a" | "b" };

export type GrammarExample = {
  parts: GrammarTextPart[];
  gloss: string;
  why: string;
};

export type GrammarCompareSide = {
  label: string;
  kicker: string;
  triggers: string[];
  examples: GrammarExample[];
};

export type GrammarCollision = {
  parts: GrammarTextPart[];
  gloss: string;
  note: string;
};

export type GrammarShiftRow = {
  verb: string;
  // "b" is rendered before "a" to match the compare cards' reading order
  // (side b's tense is the default/expected one, side a's is the shift).
  formB: { form: string; meaning: string };
  formA: { form: string; meaning: string };
};

// A single "which one fits here" question -- tests whether the reader
// knows which side of the comparison a sentence calls for, not whether
// they can produce the form themselves (the conjugator already covers
// that). The blank is split around the correct word rather than storing
// one sentence string so the UI can swap in the answer once revealed.
export type GrammarQuizQuestion = {
  before: string;
  after: string;
  infinitive: string;
  correctTone: "a" | "b";
  correctForm: string;
  explanation: string;
};

export type GrammarTopic = {
  slug: string;
  title: string;
  summary: string;
  lede: string;
  quickTake: GrammarTextPart[];
  // Tuple order fixes the tone mapping: index 0 is always tone "a", index 1 tone "b".
  compare: [GrammarCompareSide, GrammarCompareSide];
  collision?: GrammarCollision;
  shiftTableIntro?: string;
  shiftTable?: GrammarShiftRow[];
  quiz?: GrammarQuizQuestion[];
  // Copy for the card shown before the on-page quiz, inviting the reader
  // to test themselves rather than just read past it.
  quizCta: { heading: string; body: string; buttonLabel: string };
};

// A topic that's been picked but not written up yet -- shown on the
// grammar list page as an inactive row with a "Coming soon" tag, so
// learners can see what's planned instead of the list quietly ending.
export type GrammarTopicPreview = {
  title: string;
  summary: string;
};
