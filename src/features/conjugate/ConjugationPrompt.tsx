import type { Tense, VerbConjugation } from "../../languages/types";

type ConjugationPromptProps = {
  randomVerb: VerbConjugation | null;
  tenseLabels: Record<Tense, string>;
};

// The badges + English sentence header, shared between the typed-input and
// multiple-choice question layouts -- everything below this differs by
// input mode, but what's being asked never does.
const ConjugationPrompt = ({ randomVerb, tenseLabels }: ConjugationPromptProps) => (
  <>
    {(randomVerb?.tense || randomVerb?.mood) && (
      <div className="quiz-badges">
        {randomVerb?.tense && (
          <div className={`quiz-mood ${randomVerb.tense}`}>{tenseLabels[randomVerb.tense]}</div>
        )}
        {randomVerb?.tense === "imperative" && randomVerb?.polarity ? (
          <div className={`quiz-mood ${randomVerb.polarity}`}>
            {randomVerb.polarity === "negative" ? "Negative" : "Affirmative"}
          </div>
        ) : (
          randomVerb?.mood && (
            <div className={`quiz-mood ${randomVerb.mood}`}>
              {randomVerb.mood === "subjunctive" ? "Subjunctive" : "Indicative"}
            </div>
          )
        )}
      </div>
    )}
    <div className="quiz-sentence">
      {randomVerb?.mood === "subjunctive" && randomVerb?.tense !== "imperative" && (
        <span className="quiz-subjunctive-marker">(that)</span>
      )}
      {randomVerb?.pronoun_english && (
        <span className="quiz-pronoun">{randomVerb.pronoun_english}</span>
      )}
      <span className="quiz-word">{randomVerb?.form_english ?? "..."}</span>
    </div>
  </>
);

export default ConjugationPrompt;
