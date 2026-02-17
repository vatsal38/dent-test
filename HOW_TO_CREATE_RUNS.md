# How to Create and Use Runs - Manual Guide

## The Problem

You're seeing no runs because:
1. **No templates exist** - Run templates are organization-specific and need to be created first
2. **Runs require templates** - Currently, you need a template to create a run (or create a custom run)

## Solution: Create a Custom Run (No Template Needed)

### Step 1: Create a Custom Run

1. Go to **Runs** page (`/app/runs`)
2. Click **"+ Create Custom Run"** button
3. Enter a run name (e.g., "Weekly Pipeline Review")
4. Click **"Create"**
5. You'll be redirected to the run detail page

### Step 2: The Run Will Be Empty

When you create a custom run without a template:
- The run is created with **status: "in_progress"**
- But it has **NO STEPS** initially
- You'll see an empty run page

### Step 3: Understanding the Flow

**Current Limitation**: The UI doesn't yet support adding steps to a run after creation. Steps are only created from templates.

**Workaround Options**:

#### Option A: Create a Template First (Recommended)

You need to create a run template in the database. Here's how:

**Via Database (Direct SQL/Prisma):**

```sql
-- Get your organization ID first
SELECT id FROM organizations WHERE ...;

-- Then create a template
INSERT INTO run_templates (
  id, 
  "orgId", 
  name, 
  description, 
  category, 
  impact, 
  "estimatedMinutes", 
  steps, 
  "isBuiltIn", 
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'clx...', -- Generate a CUID
  'your-org-id',
  'Weekly Pipeline Review',
  'Review all active partnerships, identify stale relationships, and plan follow-ups',
  'pipeline',
  'high',
  30,
  '[
    {"order": 0, "title": "Review at-risk partnerships", "description": "Check partnerships with no contact in 14+ days", "actionType": "review"},
    {"order": 1, "title": "Check MOU status", "description": "Review all sent MOUs awaiting signature", "actionType": "review"},
    {"order": 2, "title": "Draft follow-up emails", "description": "Compose emails for top 3 priority follow-ups", "actionType": "email"},
    {"order": 3, "title": "Update pipeline stages", "description": "Move partnerships to correct stages", "actionType": "update_stage"}
  ]'::jsonb,
  false,
  true,
  NOW(),
  NOW()
);
```

**Via Backend API (if endpoint exists):**

Currently, there's no API endpoint to create templates. You would need to:
1. Add a POST endpoint to `/api/education/runs/templates`
2. Or use Prisma Studio / direct database access

#### Option B: Use the Backend Directly

You can create a run with steps directly via API:

```bash
# Create a run with steps
curl -X POST http://localhost:3001/api/education/runs \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "My Custom Run",
    "description": "A test run",
    "linkedPartnershipIds": []
  }'
```

But this still won't have steps unless you add them manually to the database.

## The Real Flow (How It Should Work)

### Ideal Flow:

1. **Templates Exist** (created by admin or system)
   - Templates define reusable step sequences
   - Each template has: name, description, steps array

2. **User Creates Run from Template**
   - Selects a template
   - Enters run name
   - System creates run + steps from template

3. **User Executes Run**
   - Starts each step
   - Performs actions (review, email, etc.)
   - Marks steps complete
   - Completes run

### Current State:

- ✅ Can create custom runs (no template)
- ✅ Can view run detail page
- ❌ Can't add steps to custom runs via UI
- ❌ No templates exist (need to create manually)
- ❌ No API to create templates

## Quick Fix: Create a Template Manually

### Using Prisma Studio:

1. Start your backend
2. Run: `npx prisma studio`
3. Navigate to `RunTemplate` table
4. Click "Add record"
5. Fill in:
   - `orgId`: Your organization ID
   - `name`: "Weekly Pipeline Review"
   - `description`: "Review partnerships and plan follow-ups"
   - `category`: "pipeline"
   - `impact`: "high"
   - `estimatedMinutes`: 30
   - `steps`: Paste this JSON:
   ```json
   [
     {
       "order": 0,
       "title": "Review at-risk partnerships",
       "description": "Check partnerships with no contact in 14+ days",
       "actionType": "review"
     },
     {
       "order": 1,
       "title": "Check MOU status",
       "description": "Review all sent MOUs awaiting signature",
       "actionType": "review"
     },
     {
       "order": 2,
       "title": "Draft follow-up emails",
       "description": "Compose emails for top 3 priority follow-ups",
       "actionType": "email"
     },
     {
       "order": 3,
       "title": "Update pipeline stages",
       "description": "Move partnerships to correct stages based on activity",
       "actionType": "update_stage"
     }
   ]
   ```
   - `isBuiltIn`: false
   - `isActive`: true
6. Save

### Using SQL:

```sql
-- Replace 'your-org-id' with your actual org ID
INSERT INTO run_templates (
  id,
  "orgId",
  name,
  description,
  category,
  impact,
  "estimatedMinutes",
  steps,
  "isBuiltIn",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text, -- or use a CUID generator
  'your-org-id',
  'Weekly Pipeline Review',
  'Review all active partnerships, identify stale relationships, and plan follow-ups',
  'pipeline',
  'high',
  30,
  '[
    {"order": 0, "title": "Review at-risk partnerships", "description": "Check partnerships with no contact in 14+ days", "actionType": "review"},
    {"order": 1, "title": "Check MOU status", "description": "Review all sent MOUs awaiting signature", "actionType": "review"},
    {"order": 2, "title": "Draft follow-up emails", "description": "Compose emails for top 3 priority follow-ups", "actionType": "email"},
    {"order": 3, "title": "Update pipeline stages", "description": "Move partnerships to correct stages", "actionType": "update_stage"}
  ]'::jsonb,
  false,
  true,
  NOW(),
  NOW()
);
```

## After Creating a Template

1. Refresh the Runs page
2. You should see your template in "Available Run Templates"
3. Click "Start Run" on the template
4. Enter a run name and click "Create"
5. You'll be redirected to the run with all steps ready!

## Summary

**To get runs working:**

1. **Create a template manually** (via Prisma Studio or SQL)
2. **Refresh the Runs page** - template will appear
3. **Create a run from template** - steps will be created automatically
4. **Execute the run** - follow the steps

**The flow:**
```
Template (with steps) → Create Run → Run (with steps) → Execute Steps → Complete Run
```

**Current limitation:**
- No UI to create templates (need to add API endpoint)
- Custom runs can be created but have no steps (need UI to add steps)

**Next steps to fully enable:**
1. Add API endpoint: `POST /api/education/runs/templates`
2. Add UI to create/edit templates
3. Add UI to add steps to custom runs
