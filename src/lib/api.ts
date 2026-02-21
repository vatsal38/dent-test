import { auth } from './firebase';

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
    contactEmail: string | null;
    contactJobTitle: string | null;
    stage: string;
    stageLabel: string;
    partnershipType: string;
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
    partnershipType: string;
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
    partnershipType: string;
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
}

export async function getPartnershipTotals(): Promise<PartnershipTotalsResponse> {
    return apiRequest<PartnershipTotalsResponse>('/api/education/partnerships/totals');
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
