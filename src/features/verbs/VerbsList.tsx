"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import EmptyState from "../../components/EmptyState";
import type { VerbEntry } from "../../languages/types";

type VerbsListProps = {
  code: string;
  verbs: VerbEntry[];
};

// Strips accents so a plain-ASCII search ("etre") still matches an
// accented verb ("être") -- most people typing on a US keyboard won't
// bother with the diacritics.
const stripDiacritics = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "");

const VerbsList = ({ code, verbs }: VerbsListProps) => {
  const [query, setQuery] = useState("");

  const filteredVerbs = useMemo(() => {
    const normalizedQuery = stripDiacritics(query.trim().toLowerCase());
    if (!normalizedQuery) return verbs;
    return verbs.filter(([target, english]) =>
      stripDiacritics(`${target} ${english}`.toLowerCase()).includes(normalizedQuery),
    );
  }, [verbs, query]);

  return (
    <>
      <div className="verbs-toolbar">
        <input
          type="search"
          className="search-input"
          placeholder="Search verbs..."
          aria-label="Search verbs"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="verbs-list">
        {filteredVerbs.length === 0 ? (
          <EmptyState>No verbs found.</EmptyState>
        ) : (
          filteredVerbs.map(([target, english], index) => (
            <Link
              href={`/${code}/verbs/${encodeURIComponent(target)}`}
              className="verb-row"
              key={`${target}-${english}-${index}`}
            >
              <span className="verb-target">{target}</span>
              <span className="verb-english">{english}</span>
            </Link>
          ))
        )}
      </div>
    </>
  );
};

export default VerbsList;
