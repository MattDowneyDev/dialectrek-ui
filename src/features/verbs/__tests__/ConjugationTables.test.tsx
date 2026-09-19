import { render, screen } from "@testing-library/react";
import { test, expect } from "vitest";
import {
  IMPERATIVE_AFTER_INDEX,
  ImperativeTable,
  MergedConjugationTable,
  TENSE_GROUPS,
  TenseGroupSection,
} from "../ConjugationTables";
import type {
  ImperativeConjugationTable,
  VerbConjugationTable,
} from "../../../languages/types";

const indicativeTable: VerbConjugationTable = {
  infinitive_target: "hablar",
  infinitive_english: "to speak",
  mood: "indicative",
  tense: "present",
  conjugations: [
    {
      pronoun_target: "yo",
      pronoun_english: "I",
      form_target: "hablo",
      form_target_alt: "hablás",
      form_english: "speak",
    },
    {
      pronoun_target: "tú",
      pronoun_english: "you",
      form_target: "hablas",
      form_english: "speak",
    },
  ],
};

const subjunctiveTable: VerbConjugationTable = {
  infinitive_target: "hablar",
  infinitive_english: "to speak",
  mood: "subjunctive",
  tense: "present",
  conjugations: [
    {
      pronoun_target: "yo",
      pronoun_english: "I",
      form_target: "hable",
      form_target_alt: "hablés",
      form_english: "speak",
    },
    {
      pronoun_target: "tú",
      pronoun_english: "you",
      form_target: "hables",
      form_english: "speak",
    },
  ],
};

test("renders indicative and subjunctive columns side by side, with alt forms and glosses", () => {
  render(
    <MergedConjugationTable
      indicative={indicativeTable}
      subjunctive={subjunctiveTable}
      hasSubjunctive
      displayName="Spanish"
    />,
  );
  expect(screen.getByText("yo")).toBeInTheDocument();
  expect(screen.getByText("hablo / hablás")).toBeInTheDocument();
  expect(screen.getByText("I speak")).toBeInTheDocument();
  expect(screen.getByText("hable / hablés")).toBeInTheDocument();
  expect(screen.getByText("(that) I speak")).toBeInTheDocument();
});

test("leaves the subjunctive cell empty when hasSubjunctive is true but no subjunctive data was given for that row", () => {
  render(
    <MergedConjugationTable
      indicative={indicativeTable}
      subjunctive={null}
      hasSubjunctive
      displayName="Spanish"
    />,
  );
  expect(screen.getByText("hablo / hablás")).toBeInTheDocument();
  expect(screen.queryByText(/\(that\)/)).not.toBeInTheDocument();
});

test("shows a no-subjunctive note spanning all rows when the language has no subjunctive for this tense", () => {
  render(
    <MergedConjugationTable
      indicative={indicativeTable}
      subjunctive={null}
      hasSubjunctive={false}
      displayName="French"
    />,
  );
  const note = screen.getByText("French has no subjunctive form for this tense.");
  expect(note).toBeInTheDocument();
  expect(note.closest("td")).toHaveAttribute("rowSpan", "2");
  // Only the first row gets the note cell -- the second row has just two cells.
  const rows = screen.getAllByRole("row");
  const secondBodyRow = rows[2];
  expect(secondBodyRow.children).toHaveLength(2);
});

test("renders forms without a trailing alt form when none is given", () => {
  render(
    <MergedConjugationTable
      indicative={indicativeTable}
      subjunctive={subjunctiveTable}
      hasSubjunctive
      displayName="Spanish"
    />,
  );
  expect(screen.getByText("hablas")).toBeInTheDocument();
  expect(screen.getByText("hables")).toBeInTheDocument();
});

const imperativeTable: ImperativeConjugationTable = {
  infinitive_target: "hablar",
  infinitive_english: "to speak",
  tense: "imperative",
  conjugations: [
    {
      pronoun_target: "tú",
      pronoun_english: "you",
      form_target_affirmative: "habla",
      form_target_negative: "no hables",
      form_english_affirmative: "speak",
      form_english_negative: "don't speak",
    },
  ],
};

test("renders the imperative table's affirmative and negative columns", () => {
  render(<ImperativeTable table={imperativeTable} />);
  expect(screen.getByText("Affirmative")).toBeInTheDocument();
  expect(screen.getByText("Negative")).toBeInTheDocument();
  expect(screen.getByText("habla")).toBeInTheDocument();
  expect(screen.getByText("no hables")).toBeInTheDocument();
  expect(screen.getByText("don't speak")).toBeInTheDocument();
});

test("TENSE_GROUPS lists every supported tense and IMPERATIVE_AFTER_INDEX points at present", () => {
  expect(TENSE_GROUPS.map((group) => group.tense)).toContain("present");
  expect(TENSE_GROUPS[IMPERATIVE_AFTER_INDEX].tense).toBe("present");
});

test("TenseGroupSection renders nothing when there's no indicative data for the group", () => {
  const { container } = render(
    <TenseGroupSection
      group={{ tense: "present", label: "Present" }}
      data={{ indicative: null, subjunctive: null }}
      displayName="Spanish"
      hasSubjunctive
    />,
  );
  expect(container).toBeEmptyDOMElement();
});

test("TenseGroupSection renders the group's table under its label once indicative data exists", () => {
  render(
    <TenseGroupSection
      group={{ tense: "present", label: "Present" }}
      data={{ indicative: indicativeTable, subjunctive: subjunctiveTable }}
      displayName="Spanish"
      hasSubjunctive
    />,
  );
  expect(screen.getByRole("heading", { name: "Present" })).toBeInTheDocument();
  expect(screen.getByText("yo")).toBeInTheDocument();
});

test("TenseGroupSection prefers a custom label over the group's default label", () => {
  render(
    <TenseGroupSection
      group={{ tense: "perfect", label: "Present Perfect" }}
      data={{ indicative: indicativeTable, subjunctive: null }}
      displayName="French"
      label="Passé Composé"
      hasSubjunctive={false}
    />,
  );
  expect(screen.getByRole("heading", { name: "Passé Composé" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Present Perfect" })).not.toBeInTheDocument();
});
