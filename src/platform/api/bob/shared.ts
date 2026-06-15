export interface BobRosterSchemaField {
  name: string;
  type: string;
  linkedTableId?: string | null;
  choices?: string[];
}

export interface BobRosterSchemaResponse {
  table: { id: string; name: string };
  primaryFieldId: string | null;
  fields: BobRosterSchemaField[];
  intakeTable?: { id: string; name: string };
  studentsAlumsTable?: { id: string; name: string } | null;
  programsTable?: {
    id: string;
    name: string;
    fields: BobRosterSchemaField[];
  } | null;
  programsFieldName?: string | null;
  programOptions?: Array<{ id: string; label: string }>;
  recruitmentStatuses?: string[];
}

export interface BobImportJobStatus {
  running: boolean;
  startedAt?: string | null;
  finishedAt?: string | null;
  elapsed?: string | null;
  recordsPerSecond?: number | null;
  progress: {
    phase: string;
    message?: string | null;
    scanned: number;
    imported: number;
    updated: number;
    skipped: number;
    promoted?: number;
    totalInMongo?: number | null;
  };
  result?: {
    message?: string;
    scanned?: number;
    imported?: number;
    updated?: number;
    skipped?: number;
    totalInMongo?: number;
    elapsedSec?: number;
  } | null;
  lastError?: { message?: string } | null;
}
