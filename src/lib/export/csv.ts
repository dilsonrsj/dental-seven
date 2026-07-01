export function toCsv(
  rows: Record<string, unknown>[],
  columns: string[],
): string {
  const escape = (value: unknown) => {
    const text = value == null ? "" : String(value);
    if (text.includes(",") || text.includes('"') || text.includes("\n")) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const header = columns.join(",");
  const lines = rows.map((row) =>
    columns.map((column) => escape(row[column])).join(","),
  );
  return [header, ...lines].join("\n");
}
