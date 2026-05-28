export * from "./shared";
export * from "./me";
export * from "./airtable";
export * from "./stats";
export * from "./dashboard";
export * from "./students";
export * from "./onboarding";
export * from "./recruitment";
export * from "./pods";
export * from "./milestones";
export * from "./attendance";
export * from "./submissions";
export * from "./staff.ts";

// Backward compatibility: resolve labels lived on students in api.ts
export { resolveBobAirtableRecordLabels } from "./airtable";
