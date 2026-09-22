"use client";

import type { ReactNode } from "react";

// Wraps a grid of SelectionCards -- shared so every picker screen (which
// category, which tense, ...) lays its cards out identically instead of
// each one redeclaring the same grid.
export const SelectionGrid = ({ children }: { children: ReactNode }) => (
  <div className="selection-grid">{children}</div>
);

type SelectionCardProps = {
  title: string;
  // Omit for a plain picker that has nothing more to say about each
  // option than its name. A plain sentence for most pickers (e.g.
  // flashcards' categories); a small fragment (e.g. an example phrase
  // over its translation) is fine too, not just a string.
  description?: ReactNode;
  // The single "this is the default/no-filter option" card in a group
  // (e.g. flashcards' "All words") -- a styling hint, not a toggle state.
  highlighted?: boolean;
  // A toggled-on state for multi-select pickers (e.g. Conjugate's tenses),
  // as opposed to a picker where clicking a card just navigates onward.
  selected?: boolean;
  onClick: () => void;
};

// A selectable tile: a title, an optional description, and a click
// handler -- shared by every "pick one (or more) of these" screen instead
// of each feature hand-rolling its own card markup and drifting out of
// sync with the others over time. aria-label is always set to just the
// title (never left to the browser's default concatenation of every line
// of text inside the button), so a description doesn't leak into the
// accessible name.
const SelectionCard = ({
  title,
  description,
  highlighted,
  selected,
  onClick,
}: SelectionCardProps) => (
  <button
    type="button"
    className={`selection-card${highlighted ? " selection-card--highlighted" : ""}${
      selected ? " selection-card--selected" : ""
    }`}
    aria-label={title}
    onClick={onClick}
  >
    <span className="selection-card-title">{title}</span>
    {description && <span className="selection-card-desc">{description}</span>}
  </button>
);

export default SelectionCard;
