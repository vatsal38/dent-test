# Airtable Data Flow & Client Expectations

## ✅ Current Status: All Your Fields Are Mapped!

Based on your Airtable fields, here's how everything works:

## 📋 Your Airtable Fields → What You See in Dent Ops OS

| Your Airtable Field | Where It Appears | How It's Used |
|---------------------|------------------|---------------|
| **Name** or **Organization/School** | Partnership name on all cards | Shows as partner organization name |
| **First Name** + **Last Name** | Contact section in partnership details | Combined into full name |
| **Email** | Contact section, email actions | Used for email integration |
| **Role / Potential Roles** | Contact job title | Shows under contact name |
| **Date of Last Connection** | "Days since contact" badges | Powers priority scoring & "STUCK" detection |
| **FY26 Partner Role** | Partnership type badge | Shows on cards and detail page |
| **FY26 Partner Status** | Stage dropdown | Normalized to standard stages |
| **FY26 Partner Notes** | Notes section | Shows in organization notes |
| **Need Followup** | "STUCK" badges & priority | Adds "needs-followup" tag if Yes |
| **Notes Link** | Notes section | Combined with Partner Notes |
| **Other Key People** | Contact notes | Shows in contact details |

## 🔄 How Data Flows

### 1. **Import from Airtable** (Automatic on sync)
```
Airtable Record
    ↓
Field Mapping (your fields → database fields)
    ↓
Creates/Updates:
  - PartnerOrganization (one per organization)
  - PartnerContact (one per contact)  
  - PartnershipInstance (one per partnership)
    ↓
Appears in Dent Ops OS immediately
```

### 2. **What You See After Sync**

**Home Page:**
- Partnerships ranked by priority score (calculated from revenue, deadline, staleness)
- "STUCK" indicators for partnerships with 14+ days since contact
- Revenue badges showing estimated revenue
- "Next Action Required" suggestions

**Partnerships Page:**
- Kanban board with partnerships in their stages
- List view with all partnership details
- Revenue, contact info, and status on each card

**Partnership Detail Page:**
- Full organization info
- Contact details (name, email, role)
- Activity timeline (all notes and actions)
- Stage selector
- Notes section

## 🎯 What Works According to Client Expectations

### ✅ **Smart Prioritization**
- System calculates priority scores from:
  - Revenue potential (30% weight)
  - Deadline proximity (25% weight)
  - Days since contact/staleness (25% weight)
  - OKR alignment (20% weight)
- Top partnerships automatically surface to "START HERE" card
- "STUCK" deals highlighted (14+ days no contact)

### ✅ **Execution Clarity**
- Clear "START HERE" card with top action
- Priority scores visible (0-100%)
- "Next Action Required" shown for each partnership
- Revenue prominently displayed

### ✅ **Context Centralization**
- All partnership data in one place
- Activity timeline shows full history
- Notes from Airtable appear in notes section
- Contact info always visible

### ✅ **Stuck Deals Detection**
- Partnerships with 14+ days since contact marked "STUCK"
- Red highlighting for urgent attention
- Clear visual indicators throughout

### ✅ **Stage Management**
- Your "FY26 Partner Status" values normalized to standard stages:
  - `new_intro_made` - Initial contact
  - `awaiting_response` - Waiting for response
  - `conversation_active` - Active conversation
  - `mou_sent` - MOU sent
  - `confirmed_locked` - Confirmed and locked
  - `not_this_season` - Not this season

## ⚠️ Potential Issues & How to Verify

### 1. **Field Name Matching**
**Issue:** Airtable field names must match exactly (case-sensitive)

**Check:** 
- Go to Home page → Check Airtable sync status
- If sync shows errors, check backend logs for field name mismatches

**Fix:** Ensure your Airtable fields are named exactly:
- `Organization/School` (not `Organization` or `School`)
- `Date of Last Connection` (not `Last Connection Date`)
- `FY26 Partner Status` (not `Status` or `Partner Status`)

### 2. **Date Format**
**Issue:** "Date of Last Connection" must be a valid date

**Check:**
- If dates aren't showing correctly, check Airtable date format
- Backend parses dates automatically, but invalid dates are skipped

**Fix:** Ensure dates in Airtable are in standard date format (not text)

### 3. **Stage Normalization**
**Issue:** Your status values might not match standard stages

**Check:**
- Look at partnerships in Kanban board
- If stages seem wrong, check what values you have in "FY26 Partner Status"

**How It Works:**
- System tries to match your status values to standard stages
- If it can't match, defaults to `new_intro_made`
- Fuzzy matching handles variations like:
  - "New Intro" → `new_intro_made`
  - "Awaiting Response" → `awaiting_response`
  - "MOU Sent" → `mou_sent`
  - etc.

### 4. **Revenue Field**
**Issue:** Revenue might not show if field is missing or not numeric

**Check:**
- Look for revenue badges on partnership cards
- If missing, check if you have a "Revenue" field in Airtable

**Note:** Currently mapped to "Revenue" field. If you use a different name, we need to add it to the mapping.

### 5. **Need Followup Tag**
**Issue:** "Need Followup" tag might not appear

**Check:**
- Look for "STUCK" badges on partnerships
- Check if "Need Followup" field is set to "Yes" or `true` in Airtable

**How It Works:**
- If "Need Followup" = Yes/true → Adds "needs-followup" tag
- Tag triggers "STUCK" visual indicators

## 🔍 How to Verify Everything Works

### Step 1: Check Sync Status
1. Go to Home page
2. Look at "Airtable Sync Status" card
3. Should show:
   - ✅ Connected
   - Number of partnerships synced
   - Last sync time

### Step 2: Verify Data Appears
1. Go to Partnerships page
2. Check Kanban board:
   - Partnerships should appear in correct stages
   - Revenue badges should show (if you have revenue data)
   - Contact info should be visible
3. Click a partnership:
   - Should see organization name
   - Contact details (name, email, role)
   - Activity timeline
   - Notes from Airtable

### Step 3: Check Priority Scoring
1. Go to Home page
2. Look at "START HERE" card:
   - Should show top priority partnership
   - Priority score badge (0-100%)
   - Revenue badge
   - "Next Action Required"
3. Check "Today's Priorities":
   - Should show ranked list
   - Priority scores visible
   - "STUCK" indicators for old partnerships

### Step 4: Verify Stuck Detection
1. Look for partnerships with 14+ days since contact
2. Should see:
   - Red "STUCK" badge
   - Red highlighting on cards
   - Urgent indicators

## 📊 What Data Powers What Features

| Feature | Powered By | Your Airtable Field |
|---------|------------|---------------------|
| Priority Score | Revenue + Deadline + Staleness | Revenue, Date of Last Connection |
| "STUCK" Detection | Days since contact | Date of Last Connection |
| Stage Management | Current status | FY26 Partner Status |
| Revenue Display | Estimated revenue | Revenue (if you have this field) |
| Contact Info | Contact details | First Name, Last Name, Email, Role |
| Notes | Organization notes | FY26 Partner Notes, Notes Link |
| Follow-up Tags | Follow-up flag | Need Followup |

## ❓ Questions to Ask Client

To ensure everything works perfectly, ask:

1. **Do you have a "Revenue" field?**
   - If yes, what's it called exactly?
   - If no, we can add estimated revenue manually or calculate it

2. **What values do you use in "FY26 Partner Status"?**
   - Need to verify stage normalization is working correctly
   - Examples: "New Intro", "MOU Sent", "Confirmed", etc.

3. **Do you have any other fields we should know about?**
   - Additional contact fields?
   - Custom status values?
   - Other important data?

4. **How often should sync happen?**
   - Currently manual sync (click "Sync Now")
   - Can set up automatic sync if needed

5. **Do you want bidirectional sync?**
   - Currently: Airtable → Dent Ops OS (one-way)
   - Can enable: Dent Ops OS → Airtable (two-way)

## 🎯 Expected Behavior Summary

**What the client should see:**

1. **Morning Routine:**
   - Open app → See "START HERE" card with top priority
   - See ranked list of what to work on
   - See "STUCK" deals that need attention

2. **During Work:**
   - Click partnership → See all context
   - Add notes → Saved automatically
   - Change stage → Updates everywhere
   - See activity timeline → Full history

3. **Data Sync:**
   - Click "Sync Now" → Airtable data imports
   - New partnerships appear
   - Updated data refreshes
   - Everything stays in sync

**This matches the client's vision:**
- ✅ Know what to work on next (priority scoring)
- ✅ Never lose context (all data in one place)
- ✅ Move deals faster (clear stages & actions)
- ✅ Reduce mental load (system tells you what matters)

## 🚀 Next Steps

1. **Test with real Airtable data**
   - Connect your Airtable base
   - Run sync
   - Verify data appears correctly

2. **Check for missing fields**
   - Review what appears vs. what's in Airtable
   - Report any missing data

3. **Verify stage normalization**
   - Check if your status values map correctly
   - Adjust mapping if needed

4. **Test priority scoring**
   - Verify top partnerships make sense
   - Check if "STUCK" detection works

5. **Provide feedback**
   - What works well?
   - What's missing?
   - What needs adjustment?
