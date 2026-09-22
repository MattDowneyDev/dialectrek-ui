import type { VerbConjugation } from "../../languages/types";

type ConjugationHintAreaProps = {
  randomVerb: VerbConjugation | null;
  showHint: boolean;
  showAnswer: boolean;
};

// Both lines are always mounted (visibility toggled, one overlaid on the
// other via CSS grid -- see .hint-area) rather than conditionally rendered,
// so the card reserves each one's real height from the start instead of a
// guessed value. Only ever one visible at a time: the answer already
// implies the hint, so there's no need to keep the hint line around once
// the answer is up.
const ConjugationHintArea = ({ randomVerb, showHint, showAnswer }: ConjugationHintAreaProps) => (
  <div className="hint-area">
    <div className={`hint-text${showAnswer ? "" : " hint-text--hidden"}`}>
      {randomVerb?.form_target && (
        <>
          Answer: <strong>{randomVerb.form_target}</strong>
          {randomVerb.form_target_alt && (
            <>
              {" "}
              (or <strong>{randomVerb.form_target_alt}</strong>)
            </>
          )}
        </>
      )}
    </div>
    <div className={`hint-text${showHint && !showAnswer ? "" : " hint-text--hidden"}`}>
      {randomVerb?.infinitive_target && (
        <>
          Hint: the infinitive is <strong>{randomVerb.infinitive_target}</strong>
        </>
      )}
    </div>
  </div>
);

export default ConjugationHintArea;
