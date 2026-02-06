/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
): void {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Get headers from first item if not provided
  const headerConfig = headers || Object.keys(data[0]).map((key) => ({
    key: key as keyof T,
    label: key,
  }));

  // Create CSV header row
  const headerRow = headerConfig.map((h) => `"${h.label}"`).join(",");

  // Create data rows
  const dataRows = data.map((row) => {
    return headerConfig
      .map((h) => {
        const value = row[h.key];
        // Handle null/undefined
        if (value === null || value === undefined) {
          return '""';
        }
        // Handle dates
        if (value instanceof Date) {
          return `"${value.toISOString()}"`;
        }
        // Handle strings with commas or quotes
        if (typeof value === "string") {
          return `"${value.replace(/"/g, '""')}"`;
        }
        // Handle objects
        if (typeof value === "object") {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${value}"`;
      })
      .join(",");
  });

  // Combine header and data
  const csv = [headerRow, ...dataRows].join("\n");

  // Create blob and download
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date for export
 */
export function formatDateForExport(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
