import { auth } from './firebase';
export { auth };

// Backend API URL
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get Firebase ID token for authenticated requests
 */
export async function getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
}

/**
 * Make authenticated API request to backend
 */
export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await getIdToken();

    if (!token) {
        throw new Error('Not authenticated. Please sign in.');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.message || `API error: ${response.status}`);
    }

    return response.json();
}

// ============================================
// Auth API
// ============================================

export interface BootstrapResponse {
    user: {
        id: string;
        email: string;
        name: string | null;
        isAdmin: boolean;
    };
    orgs: Array<{
        id: string;
        name: string;
        slug: string | null;
        vertical: 'education' | 'construction';
        role: string;
    }>;
    defaultOrgId: string | null;
    isAdmin: boolean;
}

export async function bootstrap(): Promise<BootstrapResponse> {
    const token = await getIdToken();
    if (!token) {
        throw new Error('Not authenticated. Please sign in.');
    }

    const response = await fetch(`${API_BASE}/api/auth/bootstrap`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();
    if (!response.ok) {
        const error = new Error(data.error || 'Bootstrap failed') as Error & { code?: string };
        error.code = data.code;
        throw error;
    }

    return data;
}

// ============================================
// Education Home API
// ============================================

export interface EducationHomePriority {
    id: string;
    partnerName: string;
    contactName: string | null;
    partnershipType: string;
    season: string | null;
    stage: string;
    estimatedRevenue: number | null;
    confidence: 'high' | 'medium' | 'low';
    priorityScore: number;
    whyNow: string;
    lastContactAt: string | null;
    daysSinceContact: number | null;
    commitmentDate: string | null;
    daysUntilDeadline: number | null;
    okrAlignmentScore: number;
    suggestedAction: string;
    actionButtons: { label: string; type: string; primary: boolean }[];
}

export interface EducationHomeAtRisk {
    id: string;
    partnerName: string;
    contactName: string | null;
    reason: 'stale' | 'deadline' | 'unsigned_mou';
    detail: string;
    daysSinceContact: number | null;
    daysUntilDeadline: number | null;
}

export interface EducationHomeResponse {
    greeting: string;
    date: string;
    orgName: string;
    priorities: EducationHomePriority[];
    urgentCount: number;
    atRisk: EducationHomeAtRisk[];
    recentRuns: Array<{
        id: string;
        name: string;
        status: string;
        startedAt: string;
        completedAt: string | null;
        templateName: string | null;
    }>;
    querySuggestions: string[];
}

export async function getEducationHome(): Promise<EducationHomeResponse> {
    return apiRequest<EducationHomeResponse>('/api/education/home');
}

// ============================================
// Partnerships API
// ============================================

export interface PartnershipListItem {
    id: string;
    partnerOrgId: string;
    partnerName: string;
    partnerType: string;
    contactName: string | null;
    primaryContactName?: string | null;
    contactEmail: string | null;
    primaryContactEmail?: string | null;
    contactJobTitle: string | null;
    stage: string;
    stageLabel: string;
    partnershipType: string[];
    season: string | null;
    source: string | null;
    estimatedRevenue: number | null;
    priorityScore: number;
    lastContactAt: string | null;
    daysSinceContact: number | null;
    commitmentDate: string | null;
    tags: string[];
    latestActivity: {
        type: string;
        content: string | null;
        createdAt: string;
    } | null;
    pendingTasks: number;
    mouStatus: string | null;
    createdAt: string;
}

export type PartnershipSummary = PartnershipListItem;

export interface PartnershipsListResponse {
    view: 'list' | 'kanban';
    partnerships?: PartnershipListItem[];
    columns?: Array<{
        stage: string;
        label: string;
        count: number;
        partnerships: PartnershipListItem[];
    }>;
    total: number;
    limit?: number;
    offset?: number;
}

export interface PartnershipDetail {
    id: string;
    partnerOrgId: string;
    partnerName: string;
    partnerType: string;
    stage: string;
    stageLabel: string;
    partnershipType: string[];
    season: string | null;
    source: string | null;
    estimatedRevenue: number | null;
    priorityScore: number;
    lastContactAt: string | null;
    commitmentDate: string | null;
    tags: string[];
    createdAt: string;
    contacts: Array<{
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        jobTitle: string | null;
        isPrimary: boolean;
    }>;
    activities: Array<{
        id: string;
        type: string;
        content: string | null;
        source: string;
        userId: string | null;
        previousStage: string | null;
        newStage: string | null;
        emailSubject: string | null;
        createdAt: string;
    }>;
    tasks: Array<{
        id: string;
        title: string;
        description: string | null;
        dueDate: string | null;
        status: string;
        priority: string;
        assignedTo: string | null;
        completedAt: string | null;
    }>;
    artifacts: Array<{
        id: string;
        type: string;
        name: string;
        status: string;
        sentAt: string | null;
        signedAt: string | null;
    }>;
}

export async function getPartnerships(options?: {
    view?: 'list' | 'kanban';
    stage?: string;
    type?: string;
    season?: string;
    search?: string;
    sortBy?: 'lastContactAt' | 'estimatedRevenue' | 'priorityScore' | 'createdAt' | 'name';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    assignedTo?: string;
}): Promise<PartnershipsListResponse> {
    const params = new URLSearchParams();
    if (options?.view) params.set('view', options.view);
    if (options?.stage) params.set('stage', options.stage);
    if (options?.type) params.set('type', options.type);
    if (options?.season) params.set('season', options.season);
    if (options?.search) params.set('search', options.search);
    if (options?.sortBy) params.set('sortBy', options.sortBy);
    if (options?.sortOrder) params.set('sortOrder', options.sortOrder);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    if (options?.assignedTo) params.set('assignedTo', options.assignedTo);
    
    const qs = params.toString();
    return apiRequest<PartnershipsListResponse>(`/api/education/partnerships${qs ? `?${qs}` : ''}`);
}

export async function getPartnershipDetails(partnershipId: string): Promise<PartnershipDetail> {
    return apiRequest<PartnershipDetail>(`/api/education/partnerships/${partnershipId}`);
}

export async function addPartnershipNote(
    partnershipId: string,
    content: string
): Promise<{ id: string; type: string; content: string; createdAt: string }> {
    return apiRequest(`/api/education/partnerships/${partnershipId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content }),
    });
}

export async function updatePartnershipStage(
    partnershipId: string,
    stage: string
): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/api/education/partnerships/${partnershipId}`, {
        method: 'PATCH',
        body: JSON.stringify({ stage }),
    });
}

export async function updatePartnershipRoles(
    partnershipId: string,
    partnershipType: string[]
): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/api/education/partnerships/${partnershipId}`, {
        method: 'PATCH',
        body: JSON.stringify({ partnershipType }),
    });
}

export interface AddContactInput {
    name: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    isPrimary?: boolean;
}

export interface Contact {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    jobTitle: string | null;
    isPrimary: boolean;
}

export async function addPartnershipContact(
    partnershipId: string,
    data: AddContactInput
): Promise<Contact> {
    return apiRequest(`/api/education/partnerships/${partnershipId}/contacts`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export interface SendEmailInput {
    to: string | string[];
    subject: string;
    body: string;
    bodyHtml?: string;
    preserveSignature?: boolean;
    attachments?: Array<{ filename: string; mimeType: string; content: string }>;
}

export async function sendEmailReply(
    threadId: string,
    data: SendEmailInput
): Promise<{ success: boolean; messageId: string; threadId: string }> {
    return apiRequest(`/api/education/inbox/threads/${threadId}/send-reply`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function sendEmail(
    data: SendEmailInput & { partnershipId?: string }
): Promise<{ success: boolean; messageId: string; threadId: string }> {
    return apiRequest('/api/education/inbox/send-email', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export interface CreatePartnershipInput {
    organizationName: string;
    organizationType: string;
    primaryContactName: string;
    primaryContactEmail?: string;
    primaryContactJobTitle?: string;
    primaryContactPhone?: string;
    partnershipType: string[];
    initialStage: string;
    season?: string;
    source?: string;
    estimatedRevenue?: number;
    tags?: string[];
}

export interface DuplicateOrg {
    id: string;
    name: string;
    type: string;
    partnershipCount: number;
}

export interface CreatePartnershipResponse {
    id: string;
    partnerOrgId: string;
    contactId: string;
    message: string;
}

export interface DuplicateErrorResponse {
    error: string;
    duplicates: DuplicateOrg[];
    message: string;
}

/** Create a new partnership */
export async function createPartnership(
    data: CreatePartnershipInput
): Promise<CreatePartnershipResponse> {
    const token = await getIdToken();
    if (!token) {
        throw new Error('Not authenticated. Please sign in.');
    }

    const response = await fetch(`${API_BASE}/api/education/partnerships`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...data,
            tags: data.tags || [],
        }),
    });

    const responseData = await response.json();

    if (!response.ok) {
        // Handle duplicate error (409 status)
        if (response.status === 409 && responseData.duplicates) {
            const error = new Error(responseData.message || 'Duplicate found') as Error & { status?: number; data?: DuplicateErrorResponse };
            error.status = 409;
            error.data = responseData;
            throw error;
        }
        throw new Error(responseData.error || responseData.message || `API error: ${response.status}`);
    }

    return responseData;
}

/** Create a new partnership instance for an existing organization */
export async function createPartnershipForExistingOrg(
    partnerOrgId: string,
    data: Omit<CreatePartnershipInput, 'organizationName' | 'organizationType'>
): Promise<CreatePartnershipResponse> {
    return apiRequest<CreatePartnershipResponse>(`/api/education/partnerships/existing/${partnerOrgId}`, {
        method: 'POST',
        body: JSON.stringify({
            ...data,
            tags: data.tags || [],
        }),
    });
}

export interface PartnershipTotalsResponse {
    byType: Array<{
        partnershipType: string;
        label: string;
        count: number;
        totalRevenue: number;
    }>;
    byStage: Array<{
        stage: string;
        label: string;
        count: number;
    }>;
    totals: {
        totalPartnerships: number;
        totalRevenue: number;
    };
    totalCount?: number;
    totalEstimatedRevenue?: number;
    countsByStage?: Record<string, number>;
}

export async function getPartnershipTotals(options?: { assignedTo?: string }): Promise<PartnershipTotalsResponse> {
    const params = new URLSearchParams();
    if (options?.assignedTo) params.set('assignedTo', options.assignedTo);
    const qs = params.toString();
    return apiRequest<PartnershipTotalsResponse>(`/api/education/partnerships/totals${qs ? `?${qs}` : ''}`);
}

// ============================================
// Inbox API
// ============================================

export interface GmailThread {
    id: string;
    gmailThreadId: string;
    subject: string;
    fromName: string | null;
    fromEmail: string;
    snippet: string | null;
    category: 'unlinked_intro' | 'needs_response' | 'hot_lead' | 'mou_related';
    isRead: boolean;
    hasAttachment: boolean;
    attachments?: Array<{
        messageId: string;
        attachmentId: string;
        filename: string;
        mimeType: string;
        size: number;
    }>;
    receivedAt: string;
    partnershipId: string | null;
    partnerName: string | null;
    contactedBy?: {
        userId: string;
        userName: string | null;
        contactedAt: string;
    } | null;
}

export interface GmailThreadsResponse {
    connected: boolean;
    threads?: GmailThread[];
    counts: Record<string, number>;
    syncStatus?: string | null;
}

export async function getGmailThreads(options?: {
    category?: string;
    reviewed?: string;
    partnershipContactsOnly?: string;
}): Promise<GmailThreadsResponse> {
    const params = new URLSearchParams();
    if (options?.category) params.set('category', options.category);
    if (options?.reviewed) params.set('reviewed', options.reviewed);
    if (options?.partnershipContactsOnly) params.set('partnershipContactsOnly', options.partnershipContactsOnly);
    const qs = params.toString();
    return apiRequest<GmailThreadsResponse>(`/api/education/inbox/threads${qs ? `?${qs}` : ''}`);
}

export async function linkThread(
    threadId: string,
    partnershipId: string
): Promise<{ success: boolean }> {
    return apiRequest(`/api/education/inbox/threads/${threadId}/link`, {
        method: 'POST',
        body: JSON.stringify({ partnershipId }),
    });
}

export async function createPartnerFromEmail(
    threadId: string,
    data: { organizationName: string; contactName: string; contactEmail?: string; partnershipType?: string }
): Promise<{ success: boolean; partnerOrg: { id: string; name: string }; contact: { id: string; name: string }; partnership: { id: string; stage: string } }> {
    return apiRequest(`/api/education/inbox/threads/${threadId}/create-partner`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function markThreadReviewed(threadId: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/education/inbox/threads/${threadId}/mark-reviewed`, {
        method: 'POST',
    });
}

export async function unlinkThread(threadId: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/education/inbox/threads/${threadId}/unlink`, {
        method: 'POST',
    });
}

/**
 * Downloads an email attachment from the backend
 */
export async function downloadGmailAttachment(messageId: string, attachmentId: string, filename: string, mimeType: string) {
    const token = await getIdToken();
    if (!token) throw new Error('Not authenticated');

    const params = new URLSearchParams({ filename, mimeType });
    const response = await fetch(`${API_BASE}/api/education/inbox/messages/${messageId}/attachments/${attachmentId}?${params.toString()}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to download attachment');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// ============================================
// Airtable Integration API
// ============================================

export interface AirtableStatus {
    connected: boolean;
    baseId?: string;
    tableId?: string;
    syncDirection?: string;
    status?: string;
    lastSyncAt?: string | null;
    syncErrorMessage?: string | null;
    fieldMapping?: Record<string, string>;
}

export async function getAirtableStatus(): Promise<AirtableStatus> {
    return apiRequest<AirtableStatus>('/api/education/airtable/status');
}

export async function connectAirtable(data: {
    apiKey: string;
    baseId: string;
    tableId: string;
}): Promise<{ success: boolean; connectionId: string; fieldMapping: Record<string, string> }> {
    return apiRequest('/api/education/airtable/connect', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function syncAirtable(): Promise<{
    import: { imported: number; updated: number; errors: number };
    export: { exported: number; errors: number };
    lastSyncAt: string;
}> {
    const result = await apiRequest<{
        import: { imported: number; updated: number; errors: number };
        export: { exported: number; errors: number };
        lastSyncAt: string;
    }>('/api/education/airtable/sync', {
        method: 'POST',
    });
    
    // Refresh status after sync
    return result;
}

export async function disconnectAirtable(): Promise<{ success: boolean }> {
    return apiRequest('/api/education/airtable/disconnect', {
        method: 'POST',
    });
}

export interface AirtableRecord {
    id: string;
    fields: Record<string, any>;
}

export async function searchAirtable(query: string): Promise<{ records: AirtableRecord[] }> {
    return apiRequest<{ records: AirtableRecord[] }>(`/api/integrations/airtable/search?search=${encodeURIComponent(query)}`);
}

export async function importAirtableRecord(recordId: string): Promise<{ partnershipId: string; success: boolean }> {
    return apiRequest<{ partnershipId: string; success: boolean }>('/api/education/partnerships/import-airtable', {
        method: 'POST',
        body: JSON.stringify({ recordId }),
    });
}

// ============================================
// Gmail Integration API
// ============================================

export interface GmailStatus {
    connected: boolean;
    provider?: string;
    emailAddress?: string | null;
    status?: string | null;
    lastSyncAt?: string | null;
    error?: string;
}

export async function getGmailStatus(): Promise<GmailStatus> {
    return apiRequest<GmailStatus>('/api/integrations/gmail/status');
}

export async function connectGmail(): Promise<{ authUrl: string }> {
    return apiRequest<{ authUrl: string }>('/api/integrations/gmail/connect');
}

export async function disconnectGmail(): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>('/api/integrations/gmail/disconnect', {
        method: 'POST',
    });
}

/** Initiate Gmail OAuth connection - redirects to Google */
export function initiateGmailConnection(): void {
    window.location.href = `${API_BASE}/api/integrations/gmail/connect`;
}

/** Trigger manual Gmail sync to fetch latest emails */
export async function syncGmail(): Promise<{ synced: number; newThreads: number; type: 'incremental' | 'full' }> {
    return apiRequest('/api/integrations/gmail/sync', {
        method: 'POST',
    });
}

// ============================================
// Runs API
// ============================================

export interface RunTemplate {
    id: string;
    name: string;
    description: string | null;
    category: string;
    impact: string;
    estimatedMinutes: number;
    steps: Array<{
        order: number;
        title: string;
        description?: string;
        actionType: string;
        config?: Record<string, unknown>;
    }>;
    isBuiltIn: boolean;
}

export interface RunStep {
    id: string;
    orderIndex: number;
    title: string;
    description: string | null;
    actionType: string;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    config: Record<string, unknown> | null;
    result: Record<string, unknown> | null;
    completedAt: string | null;
}

export interface RunDetail {
    id: string;
    name: string;
    description: string | null;
    status: string;
    runType: string;
    template: {
        name: string;
        description: string | null;
        category: string;
    } | null;
    startedAt: string;
    completedAt: string | null;
    pausedAt: string | null;
    outcome: string | null;
    linkedPartnershipIds: string[];
    steps: RunStep[];
}

export interface RunListItem {
    id: string;
    name: string;
    description: string | null;
    status: string;
    runType: string;
    templateName: string | null;
    templateCategory: string | null;
    templateImpact: string | null;
    startedAt: string;
    completedAt: string | null;
    outcome: string | null;
    stepsTotal: number;
    stepsCompleted: number;
    linkedPartnershipIds: string[];
}

export async function getRunTemplates(): Promise<{ templates: RunTemplate[] }> {
    return apiRequest<{ templates: RunTemplate[] }>('/api/education/runs/templates');
}

export async function getRuns(options?: {
    status?: string;
    limit?: number;
    offset?: number;
}): Promise<{ runs: RunListItem[]; total: number; limit: number; offset: number }> {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    const qs = params.toString();
    return apiRequest(`/api/education/runs${qs ? `?${qs}` : ''}`);
}

export async function getRunDetails(runId: string): Promise<RunDetail> {
    return apiRequest<RunDetail>(`/api/education/runs/${runId}`);
}

export async function createRun(data: {
    templateId?: string;
    name: string;
    description?: string;
    linkedPartnershipIds?: string[];
}): Promise<RunDetail> {
    return apiRequest<RunDetail>('/api/education/runs', {
        method: 'POST',
        body: JSON.stringify({
            ...data,
            linkedPartnershipIds: data.linkedPartnershipIds || [],
        }),
    });
}

export async function updateRunStep(
    runId: string,
    stepId: string,
    data: { status: string; result?: Record<string, unknown> }
): Promise<{ id: string; status: string; result: Record<string, unknown> | null; completedAt: string | null; runCompleted: boolean }> {
    return apiRequest(`/api/education/runs/${runId}/steps/${stepId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function updateRunStatus(
    runId: string,
    data: { status?: string; outcome?: string }
): Promise<{ id: string; status: string; completedAt: string | null; outcome: string | null }> {
    return apiRequest(`/api/education/runs/${runId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function createRunStep(
    runId: string,
    data: {
        title: string;
        description?: string;
        actionType?: string;
        orderIndex?: number;
        config?: Record<string, unknown>;
    }
): Promise<RunStep> {
    return apiRequest(`/api/education/runs/${runId}/steps`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// ============================================
// BOB (Bet On Baltimore) — Roster / Students
// ============================================

export const BOB_STUDENT_STATUSES = ['active', 'inactive', 'graduated', 'withdrawn'] as const;
export const BOB_INTERVIEW_STAGES = ['applied', 'screening', 'interview', 'offer', 'placed', 'not_placed'] as const;

export type BobStudentStatus = (typeof BOB_STUDENT_STATUSES)[number];
export type BobInterviewStage = (typeof BOB_INTERVIEW_STAGES)[number];

export interface BobStudentAttendanceStats {
    present?: number;
    absent?: number;
    [key: string]: number | undefined;
}

export interface BobStudentMilestoneStats {
    submitted?: number;
    total?: number;
    [key: string]: number | undefined;
}

export interface BobStudent {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    status: BobStudentStatus;
    interviewStage: BobInterviewStage;
    podId: string | null;
    school?: string | null;
    track?: string | null;
    coach?: string | null;
    stage?: string | null;
    ywStatus?: string | null;
    attendanceStats?: BobStudentAttendanceStats | null;
    milestoneStats?: BobStudentMilestoneStats | null;
    createdAt: string;
    updatedAt: string;
}

export interface BobStudentsListParams {
    status?: BobStudentStatus;
    interviewStage?: BobInterviewStage;
    search?: string;
    limit?: number;
    offset?: number;
}

export interface BobStudentsListResponse {
    students: BobStudent[];
    total: number;
    limit: number;
    offset: number;
}

export async function getBobStudents(params?: BobStudentsListParams): Promise<BobStudentsListResponse> {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    if (params?.interviewStage) sp.set('interviewStage', params.interviewStage);
    if (params?.search) sp.set('search', params.search);
    if (params?.limit != null) sp.set('limit', String(params.limit));
    if (params?.offset != null) sp.set('offset', String(params.offset));
    const qs = sp.toString();
    return apiRequest<BobStudentsListResponse>(`/api/bob/students${qs ? `?${qs}` : ''}`);
}

export async function getBobStudent(id: string): Promise<BobStudent> {
    return apiRequest<BobStudent>(`/api/bob/students/${id}`);
}

export interface CreateBobStudentInput {
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    status?: BobStudentStatus;
    interviewStage?: BobInterviewStage;
    podId?: string | null;
    school?: string | null;
    track?: string | null;
    coach?: string | null;
    stage?: string | null;
    ywStatus?: string | null;
    attendanceStats?: BobStudentAttendanceStats | null;
    milestoneStats?: BobStudentMilestoneStats | null;
}

export async function createBobStudent(data: CreateBobStudentInput): Promise<BobStudent> {
    return apiRequest<BobStudent>('/api/bob/students', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateBobStudent(id: string, data: Partial<CreateBobStudentInput>): Promise<BobStudent> {
    return apiRequest<BobStudent>(`/api/bob/students/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function deleteBobStudent(id: string): Promise<{ deleted: true }> {
    return apiRequest<{ deleted: true }>(`/api/bob/students/${id}`, { method: 'DELETE' });
}

export async function importBobStudentsFromAirtable(): Promise<{ imported: number; message?: string }> {
    return apiRequest<{ imported: number; message?: string }>('/api/bob/students/import-airtable', {
        method: 'POST',
    });
}

// ============================================
// BOB — Pods (coach sees only own pod via backend filter)
// ============================================

export interface BobPod {
    id: string;
    name: string;
    coachId: string | null;
    siteSupporterId: string | null;
    students: string[];
    createdAt: string;
    updatedAt: string;
}

export interface BobPodsListParams {
    limit?: number;
    offset?: number;
    /** When true, returns pods where current user can mark attendance (admin: all; site supporter: pods where siteSupporterId === me). */
    canMarkAttendance?: boolean;
}

export interface BobPodsListResponse {
    pods: BobPod[];
    total: number;
    limit: number;
    offset: number;
}

export async function getBobPods(params?: BobPodsListParams): Promise<BobPodsListResponse> {
    const sp = new URLSearchParams();
    if (params?.limit != null) sp.set('limit', String(params.limit));
    if (params?.offset != null) sp.set('offset', String(params.offset));
    if (params?.canMarkAttendance) sp.set('canMarkAttendance', '1');
    const qs = sp.toString();
    return apiRequest<BobPodsListResponse>(`/api/bob/pods${qs ? `?${qs}` : ''}`);
}

export async function getBobPod(id: string): Promise<BobPod> {
    return apiRequest<BobPod>(`/api/bob/pods/${id}`);
}

export interface CreateBobPodInput {
    name: string;
    coachId?: string | null;
    siteSupporterId?: string | null;
    students?: string[];
}

export async function createBobPod(data: CreateBobPodInput): Promise<BobPod> {
    return apiRequest<BobPod>('/api/bob/pods', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateBobPod(id: string, data: Partial<CreateBobPodInput> & { students?: string[] }): Promise<BobPod> {
    return apiRequest<BobPod>(`/api/bob/pods/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function deleteBobPod(id: string): Promise<{ deleted: true }> {
    return apiRequest<{ deleted: true }>(`/api/bob/pods/${id}`, { method: 'DELETE' });
}

// ============================================
// BOB — Milestones (program milestones; uses org-scoped schema + reviewStatus)
// ============================================

export interface BobMilestone {
    id: string;
    projectId: string;
    orgSlug: string;
    scopeId: string | null;
    name: string;
    scopeArea: string;
    phase: string | null;
    targetDate: string;
    targetEndDate: string;
    contractualDate: string | null;
    projectedEndDate: string | null;
    actualDate: string | null;
    actualEndDate: string | null;
    status: string;
    owner: string;
    ownerId: string | null;
    ownerName: string;
    ownerRole: string | null;
    gcTrackingNumber: number | null;
    lookaheadItemCount: number;
    lookaheadBlockedCount: number;
    materialBlockedCount: number;
    predecessors: string[];
    successors: string[];
    durationDays: number;
    isCriticalPath: boolean;
    floatDays: number | null;
    notes: string | null;
    reviewStatus: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface BobMilestonesListParams {
    orgId: string;
    status?: string;
    projectId?: string;
    phase?: string;
    reviewStatus?: string;
    tab?: 'pending_review';
}

export interface BobMilestonesListResponse {
    data: BobMilestone[];
    count: number;
}

export async function getBobMilestones(params: BobMilestonesListParams): Promise<BobMilestonesListResponse> {
    const sp = new URLSearchParams();
    sp.set('orgId', params.orgId);
    if (params.status) sp.set('status', params.status);
    if (params.projectId) sp.set('projectId', params.projectId);
    if (params.phase) sp.set('phase', params.phase);
    if (params.reviewStatus) sp.set('reviewStatus', params.reviewStatus);
    if (params.tab) sp.set('tab', params.tab);
    return apiRequest<BobMilestonesListResponse>(`/api/bob/milestones?${sp.toString()}`);
}

export async function getBobMilestone(orgId: string, milestoneId: string): Promise<BobMilestone> {
    return apiRequest<BobMilestone>(`/api/bob/milestones/${milestoneId}?orgId=${encodeURIComponent(orgId)}`);
}

export async function updateBobMilestone(orgId: string, milestoneId: string, data: Partial<Pick<BobMilestone, 'reviewStatus' | 'status' | 'notes'>>): Promise<BobMilestone> {
    return apiRequest<BobMilestone>(`/api/bob/milestones/${milestoneId}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...data, orgId }),
    });
}

// ============================================
// BOB — Command Center stats (dashboard widgets)
// ============================================

export interface BobCommandCenterStats {
    cards: {
        studentsEnrolled: number;
        youthWorksSynced: number;
        checkedInToday: number;
        milestonesThisWeek: number;
        openDiscrepancies: number;
    };
    attendanceBySite: Array<{
        siteId: string;
        siteName: string;
        present: number;
        absent: number;
        excused: number;
        late: number;
        total: number;
    }>;
    noShowsToday: string[];
    milestoneSubmissionByTrack: Array<{ track: string; submitted: number; total: number }>;
    atRiskStudents: Array<{ id: string; firstName: string; lastName: string; status: string }>;
    blitzTeams: Array<{ id: string; name: string }>;
}

export async function getBobCommandCenterStats(): Promise<BobCommandCenterStats> {
    return apiRequest<BobCommandCenterStats>('/api/bob/command-center-stats');
}

// ============================================
// BOB — Attendance (admin: all; coach: own pod; site supporter can mark)
// ============================================

export const BOB_ATTENDANCE_STATUSES = ['present', 'absent', 'excused', 'late'] as const;
export type BobAttendanceStatus = (typeof BOB_ATTENDANCE_STATUSES)[number];

export interface BobAttendance {
    id: string;
    studentId: string;
    date: string;
    podId: string;
    status: BobAttendanceStatus;
    createdAt: string;
    updatedAt: string;
}

export interface BobAttendanceListParams {
    podId?: string;
    studentId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

export interface BobAttendanceListResponse {
    attendance: BobAttendance[];
    total: number;
    limit: number;
    offset: number;
}

export async function getBobAttendance(params?: BobAttendanceListParams): Promise<BobAttendanceListResponse> {
    const sp = new URLSearchParams();
    if (params?.podId) sp.set('podId', params.podId);
    if (params?.studentId) sp.set('studentId', params.studentId);
    if (params?.date) sp.set('date', params.date);
    if (params?.startDate) sp.set('startDate', params.startDate);
    if (params?.endDate) sp.set('endDate', params.endDate);
    if (params?.limit != null) sp.set('limit', String(params.limit));
    if (params?.offset != null) sp.set('offset', String(params.offset));
    const qs = sp.toString();
    return apiRequest<BobAttendanceListResponse>(`/api/bob/attendance${qs ? `?${qs}` : ''}`);
}

export async function getBobAttendanceRecord(id: string): Promise<BobAttendance> {
    return apiRequest<BobAttendance>(`/api/bob/attendance/${id}`);
}

export interface CreateBobAttendanceInput {
    studentId: string;
    date: string;
    podId: string;
    status?: BobAttendanceStatus;
}

export async function createBobAttendance(data: CreateBobAttendanceInput): Promise<BobAttendance> {
    return apiRequest<BobAttendance>('/api/bob/attendance', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateBobAttendance(id: string, data: { status: BobAttendanceStatus }): Promise<BobAttendance> {
    return apiRequest<BobAttendance>(`/api/bob/attendance/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}
