"use client";

import LetsGoButton from "../../components/LetsGoButton";
import QuestionCard from "../../components/QuestionCard";
import SelectionCard, { SelectionGrid } from "../../components/SelectionCard";

type CategorySelectionProps = {
  categories: string[];
  categorySelection: string[];
  onToggleCategory: (category: string) => void;
  onToggleAllCategories: () => void;
  onConfirm: () => void;
};

export const formatCategory = (category: string): string =>
  category.charAt(0).toUpperCase() + category.slice(1);

// Categories come straight from the word list itself (see
// get-word-categories) rather than a fixed, describable list -- so there's
// no description data from the backend to show alongside them. These are
// hand-written blurbs for the categories that exist today; anything added
// to the word list later just falls back to a generic line built from its
// own name instead of an empty card.
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  adjective: "Words that describe people, places, and things.",
  adverb: "Words that modify a verb, adjective, or another adverb.",
  "body/health": "Body parts and health-related vocabulary.",
  "clothing/objects": "Clothing and everyday objects.",
  "common phrase/chunk": "Everyday phrases and set expressions.",
  "common verb (infinitive)": "Common verbs in their infinitive form.",
  "conjugated verb form": "Verbs already conjugated in context.",
  "connector/expression": "Words that link ideas and sentences together.",
  "core function word": "High-frequency grammatical words.",
  "emotion/abstract concept": "Feelings and abstract ideas.",
  "filler/discourse marker": "Fillers and markers used in natural speech.",
  "food/drink": "Food, drink, and dining vocabulary.",
  "home/city": "Home, housing, and city life.",
  "interjection/reaction": "Exclamations and quick reactions.",
  "money/travel": "Money, shopping, and travel terms.",
  "nature/weather": "Nature, seasons, and weather.",
  "people/family": "People, relationships, and family.",
  "question/answer chunk": "Common question and answer phrases.",
  "tech/work/school": "Technology, work, and school vocabulary.",
  "time/number": "Time, dates, and numbers.",
};

const describeCategory = (category: string): string =>
  CATEGORY_DESCRIPTIONS[category.toLowerCase()] ??
  `Words from the "${formatCategory(category)}" category.`;

const CategorySelection = ({
  categories,
  categorySelection,
  onToggleCategory,
  onToggleAllCategories,
  onConfirm,
}: CategorySelectionProps) => {
  const allSelected = categorySelection.length === categories.length;

  return (
    <QuestionCard title="Which categories of words would you like to study?">
      <SelectionGrid>
        <SelectionCard
          title="All words"
          description="Every word in the list, no filter."
          highlighted
          selected={allSelected}
          onClick={onToggleAllCategories}
        />
        {categories.map((category) => (
          <SelectionCard
            key={category}
            title={formatCategory(category)}
            description={describeCategory(category)}
            selected={categorySelection.includes(category)}
            onClick={() => onToggleCategory(category)}
          />
        ))}
      </SelectionGrid>
      <LetsGoButton disabled={categorySelection.length === 0} onClick={onConfirm} />
    </QuestionCard>
  );
};

export default CategorySelection;
