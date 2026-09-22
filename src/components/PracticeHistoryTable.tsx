import { CheckIcon, XIcon } from "./icons";

export type PracticeHistoryRow = {
  id: string;
  correct: boolean;
  cells: string[];
};

type PracticeHistoryTableProps = {
  title?: string;
  headers: string[];
  rows: PracticeHistoryRow[];
};

// Newest-first list of everything practiced so far this session, with a
// row-level correct/incorrect result -- replaces a single running score
// tile with something a viewer can actually review afterward. The result
// leads each row as a narrow icon-only column (rather than trailing as a
// "Correct"/"Incorrect" badge) so it's visible without scrolling sideways
// on a phone, and so the rest of the row has more room to itself.
const PracticeHistoryTable = ({ title, headers, rows }: PracticeHistoryTableProps) => {
  if (rows.length === 0) return null;

  return (
    <div className="history-table-wrap">
      {title && <h2 className="history-table-title">{title}</h2>}
      <div className="history-table-scroll">
        <table className="history-table">
          <thead>
            <tr>
              <th className="history-result-col">
                <span className="sr-only">Result</span>
              </th>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="history-result-col">
                  <span
                    className={`history-result${row.correct ? " correct" : " incorrect"}`}
                    role="img"
                    aria-label={row.correct ? "Correct" : "Incorrect"}
                  >
                    {row.correct ? <CheckIcon /> : <XIcon />}
                  </span>
                </td>
                {row.cells.map((cell, index) => (
                  <td key={index}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PracticeHistoryTable;
