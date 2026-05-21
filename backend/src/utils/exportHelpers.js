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

export const jobCsvHeaders = [
  "Title",
  "Department",
  "Location",
  "Status",
  "Salary Min",
  "Salary Max",
  "Skills",
  "Created At",
];

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return "";
  const stringValue = value instanceof Date ? value.toISOString() : String(value);
  return `"${stringValue.replaceAll('"', '""')}"`;
};

const rowsToCsv = (headers, rows) =>
  [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");

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

  return rowsToCsv(applicationCsvHeaders, rows);
};

export const jobsToCsv = (jobs) => {
  const rows = jobs.map((job) => [
    job.title,
    job.department,
    job.location,
    job.status,
    job.salaryMin,
    job.salaryMax,
    job.skills,
    job.createdAt,
  ]);

  return rowsToCsv(jobCsvHeaders, rows);
};

export const statsToCsv = (stats) => {
  const rows = [
    ["Jobs Total", stats.jobsTotal],
    ["Jobs Open", stats.jobsOpen],
    ["Candidates Total", stats.candidatesTotal],
    ["Applications Total", stats.applicationsTotal],
    ...Object.entries(stats.statusCounts || {}).map(([status, count]) => [
      `Applications ${status}`,
      count,
    ]),
  ];

  return rowsToCsv(["Metric", "Value"], rows);
};
