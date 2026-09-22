import { fetchImperativeConjugation, fetchVerbConjugation } from "../../languages/api";
import type { VerbConjugation } from "../../languages/types";

const shuffle = <T,>(items: T[]): T[] => items.slice().sort(() => Math.random() - 0.5);

// Pulls the verb's full conjugation table for the same mood/tense and uses
// every *other* pronoun's real form as a distractor -- these are genuine
// conjugations of the same verb (e.g. "hablas" as a wrong answer next to
// "habla"), not random noise, so picking wrong still tests real conjugation
// knowledge. Returns null if there aren't enough distinct wrong forms to
// build a question from (e.g. a heavily syncretic tense), so the caller can
// fall back to the typed-input flow for that one verb.
export const fetchAnswerChoices = async (
  language: string,
  verb: VerbConjugation,
): Promise<string[] | null> => {
  if (!verb.infinitive_target || !verb.form_target || !verb.tense) return null;

  let pool: string[];
  if (verb.tense === "imperative") {
    const table = await fetchImperativeConjugation(language, verb.infinitive_target);
    if (!table) return null;
    pool = table.conjugations.map((conjugation) =>
      verb.polarity === "negative"
        ? conjugation.form_target_negative
        : conjugation.form_target_affirmative,
    );
  } else {
    const table = await fetchVerbConjugation(
      language,
      verb.infinitive_target,
      verb.mood ?? "indicative",
      verb.tense,
    );
    if (!table) return null;
    pool = table.conjugations.map((conjugation) => conjugation.form_target);
  }

  const correctAnswer = verb.form_target;
  const normalizedCorrect = correctAnswer.trim().toLowerCase();
  const distractors = Array.from(
    new Set(
      pool
        .map((form) => form.trim())
        .filter((form) => form.length > 0 && form.toLowerCase() !== normalizedCorrect),
    ),
  );

  if (distractors.length === 0) return null;

  const picked = shuffle(distractors).slice(0, 3);
  return shuffle([...picked, correctAnswer]);
};
