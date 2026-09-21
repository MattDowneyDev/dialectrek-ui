import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import PracticeHistoryTable from "../PracticeHistoryTable";

describe("PracticeHistoryTable", () => {
  test("renders nothing when there are no rows", () => {
    const { container } = render(
      <PracticeHistoryTable title="Words practiced" headers={["Word", "Translation"]} rows={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("puts the result column first, as an icon rather than a text badge", () => {
    render(
      <PracticeHistoryTable
        title="Words practiced"
        headers={["Word", "Translation"]}
        rows={[
          { id: "1", correct: true, cells: ["hola", "hello"] },
          { id: "2", correct: false, cells: ["adiós", "goodbye"] },
        ]}
      />,
    );

    const headerCells = screen.getAllByRole("columnheader");
    expect(headerCells[0]).toHaveClass("history-result-col");
    expect(headerCells[1]).toHaveTextContent("Word");
    expect(headerCells[2]).toHaveTextContent("Translation");

    const [correctRow, incorrectRow] = screen.getAllByRole("row").slice(1);
    const correctCells = within(correctRow).getAllByRole("cell");
    expect(correctCells[0]).toHaveClass("history-result-col");
    expect(within(correctCells[0]).getByRole("img", { name: "Correct" })).toBeInTheDocument();
    expect(correctCells[1]).toHaveTextContent("hola");

    const incorrectCells = within(incorrectRow).getAllByRole("cell");
    expect(within(incorrectCells[0]).getByRole("img", { name: "Incorrect" })).toBeInTheDocument();

    // No literal "Correct"/"Incorrect" text anywhere -- just the icon and
    // its accessible name.
    expect(screen.queryByText("Correct")).not.toBeInTheDocument();
    expect(screen.queryByText("Incorrect")).not.toBeInTheDocument();
  });
});
