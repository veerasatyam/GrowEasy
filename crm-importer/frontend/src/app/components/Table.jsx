import React from 'react';

/**
 * A beautiful, highly-responsive data table with sticky headers,
 * horizontal and vertical scrolling capabilities.
 *
 * @param {Object} props
 * @param {Array<string>} props.headers - List of header names
 * @param {Array<Object>} props.rows - List of row objects or arrays
 * @param {number} [props.maxHeight=320] - Maximum height for vertical scroll (px)
 */
export default function Table({ headers, rows, maxHeight = 350 }) {
  if (!headers || headers.length === 0) {
    return (
      <div className="p-8 text-center text-text-secondary text-sm">
        No columns detected.
      </div>
    );
  }

  return (
    <div 
      className="overflow-auto border border-border-color bg-bg-panel rounded-xl"
      style={{ maxHeight: `${maxHeight}px` }}
    >
      <table className="min-w-full divide-y divide-border-color/60 text-left text-xs">
        <thead className="sticky top-0 z-20 bg-bg-table-header text-text-secondary uppercase tracking-wider font-bold shadow-sm">
          <tr>
            {headers.map((h, i) => (
              <th 
                key={i} 
                className="px-4 py-2.5 border-b border-border-color bg-bg-table-header sticky top-0 z-10 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-color/60 text-text-primary bg-bg-panel/10">
          {rows.length === 0 ? (
            <tr>
              <td 
                colSpan={headers.length} 
                className="px-4 py-8 text-center text-text-secondary italic"
              >
                No records found.
              </td>
            </tr>
          ) : (
            rows.map((row, rowIdx) => {
              const cells = Array.isArray(row) 
                ? row 
                : headers.map(h => row[h]);

              return (
                <tr 
                  key={rowIdx} 
                  className="hover:bg-bg-table-row-hover transition-colors duration-150"
                >
                  {cells.map((cell, cellIdx) => {
                    const displayValue = (cell === null || cell === undefined || String(cell).trim() === "")
                      ? "—"
                      : String(cell);

                    return (
                      <td 
                        key={cellIdx} 
                        className="px-4 py-2 max-w-[200px] truncate whitespace-nowrap border-b border-border-color/40"
                        title={displayValue}
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
