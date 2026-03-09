/**
 * Robustly formats a partner organization name, handling Airtable record IDs,
 * "Unnamed Partner" placeholders, and array values.
 */
export function formatPartnerName(name: string | string[] | null | undefined): string {
    if (!name) return 'Unnamed Partner';
    
    // Handle array values (common from Airtable lookups/linked records)
    const rawName = Array.isArray(name) ? name[0] : name;
    
    if (!rawName) return 'Unnamed Partner';
    
    // Check if it's a record ID (starts with 'rec' followed by alphanumeric)
    const isRecordId = typeof rawName === 'string' && /^rec[a-zA-Z0-9]{14}$/.test(rawName);
    
    if (isRecordId || rawName === 'Unnamed Partner' || rawName === 'Unnamed') {
        return 'Unnamed Partner';
    }
    
    return rawName;
}
