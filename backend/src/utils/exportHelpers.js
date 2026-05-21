export const applicationCsvHeaders = [
  "Company",
  "Position",
  "Status",
  "Priority",
  "Location",
  "Salary Min",
  "Salary Max",
  "Applied Date",
  "Next Step Date",
  "Job Link",
  "Notes",
];

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return "";
  const stringValue = value instanceof Date ? value.toISOString() : String(value);
  return `"${stringValue.replaceAll('"', '""')}"`;
};

export const applicationsToCsv = (applications) => {
  const rows = applications.map((app) => [
    app.companyName,
    app.positionTitle,
    app.status,
    app.priority,
    app.location,
    app.salaryMin,
    app.salaryMax,
    app.appliedDate,
    app.nextStepDate,
    app.jobLink,
    app.notes,
  ]);

  return [applicationCsvHeaders, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");
};
