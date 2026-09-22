"use client";

import LetsGoButton from "../../components/LetsGoButton";
import QuestionCard from "../../components/QuestionCard";
import SelectionCard, { SelectionGrid } from "../../components/SelectionCard";
import type { Tense, TenseExample } from "../../languages/types";

type TenseSelectionProps = {
  tenseList: Tense[];
  tenseSelection: Tense[];
  tenseLabels: Record<Tense, string>;
  tenseExamples: Record<Tense, TenseExample>;
  onToggleTense: (tense: Tense) => void;
  onToggleAllTenses: () => void;
  onConfirm: () => void;
};

const TenseSelection = ({
  tenseList,
  tenseSelection,
  tenseLabels,
  tenseExamples,
  onToggleTense,
  onToggleAllTenses,
  onConfirm,
}: TenseSelectionProps) => {
  const allSelected = tenseSelection.length === tenseList.length;

  return (
    <QuestionCard title="Which tenses would you like to practice?">
      <SelectionGrid>
        <SelectionCard
          title="All tenses"
          highlighted
          selected={allSelected}
          onClick={onToggleAllTenses}
        />
        {tenseList.map((tense) => (
          <SelectionCard
            key={tense}
            title={tenseLabels[tense]}
            description={
              <>
                <span className="tense-example-target">{tenseExamples[tense].target}</span>
                <br />
                {tenseExamples[tense].english}
              </>
            }
            selected={tenseSelection.includes(tense)}
            onClick={() => onToggleTense(tense)}
          />
        ))}
      </SelectionGrid>
      <LetsGoButton disabled={tenseSelection.length === 0} onClick={onConfirm} />
    </QuestionCard>
  );
};

export default TenseSelection;
