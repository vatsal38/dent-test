# Runs Feature Guide

## What Are Runs?

**Runs** are **Guided Work Sessions** - focused, step-by-step workflows that help you complete specific operational tasks efficiently. They're NOT automation - they guide YOU through the work.

### Key Concept
Think of Runs as a **checklist with context**. Instead of just checking boxes, each step shows you the actual data you need to work with and guides you through the action.

## How Runs Work

### 1. **Run Templates**
Pre-built templates for common operational tasks:
- **Weekly Pipeline Review** - Review partnerships, check MOU status, plan follow-ups
- **MOU Sprint** - Push all MOU-stage partnerships toward signed agreements
- **New Lead Intake** - Process new introductions and create partnership records
- **Seasonal Planning Check** - Review OKR progress and adjust priorities

### 2. **Creating a Run**
1. Go to **Runs** page (`/app/runs`)
2. Click **"Start Run"** on any template
3. Optionally customize the run name
4. Click **"Create"**
5. You're redirected to the run detail page

### 3. **Run Steps**
Each run has multiple steps with different **action types**:

#### Action Types:
- **`review`** - Review data (partnerships, emails, etc.)
  - Shows relevant data to review
  - Example: "Review at-risk partnerships" shows partnerships with no contact in 14+ days
  
- **`email`** - Compose and send emails
  - Opens email composer
  - Can link to partnerships
  - Example: "Draft follow-up emails" for top 3 priority partnerships
  
- **`update_stage`** - Update partnership stages
  - Shows partnerships that need stage updates
  - Allows changing stages directly
  - Example: "Update pipeline stages" based on latest activity
  
- **`schedule`** - Schedule meetings/calls
  - Opens calendar/scheduling interface
  - Example: "Schedule weekly calls" for this week's partners
  
- **`create_task`** - Create follow-up tasks
  - Allows creating tasks linked to partnerships
  - Example: "Set follow-up tasks" for new leads
  
- **`note`** - Add notes/documentation
  - Text area for adding notes
  - Example: "Log outcomes" for MOU responses
  
- **`custom`** - Custom action (varies by template)
  - Template-specific actions
  - Example: "Create partnership records" for new orgs

### 4. **Step Workflow**
Each step follows this flow:

1. **Pending** → Step not started yet
   - Click **"Start"** to begin
   - Click **"Skip"** to skip this step

2. **In Progress** → Step is active
   - Shows relevant data/interface based on actionType
   - Perform the action (review data, send email, etc.)
   - Click **"Complete"** when done
   - Click **"Reset"** to go back to pending

3. **Completed** → Step finished
   - Shows completion timestamp
   - Can't be undone (but can be reset if needed)

4. **Skipped** → Step was skipped
   - Can be restarted later if needed

### 5. **Run Completion**
- When all steps are completed, a **"Complete Run"** button appears
- Clicking it marks the entire run as completed
- You can add an **outcome summary** describing what was accomplished

## Example: "Weekly Pipeline Review" Run

### Step 1: Review at-risk partnerships
- **Action Type**: `review`
- **What happens**: Shows list of partnerships with no contact in 14+ days
- **What you do**: Review each partnership, note which ones need immediate attention
- **Complete**: Click "Complete" after reviewing

### Step 2: Check MOU status
- **Action Type**: `review`
- **What happens**: Shows all partnerships in "MOU Sent" stage
- **What you do**: Check which MOUs have been viewed/signed, identify which need follow-up
- **Complete**: Click "Complete" after checking

### Step 3: Draft follow-up emails
- **Action Type**: `email`
- **What happens**: Shows top 3 priority partnerships needing follow-up
- **What you do**: Compose and send personalized follow-up emails
- **Complete**: Click "Complete" after sending emails

### Step 4: Update pipeline stages
- **Action Type**: `update_stage`
- **What happens**: Shows partnerships that should move stages based on activity
- **What you do**: Update stages for partnerships (e.g., move to "Conversation Active" if they replied)
- **Complete**: Click "Complete" after updating stages

### Step 5: Schedule weekly calls
- **Action Type**: `schedule`
- **What happens**: Shows partnerships that need calls this week
- **What you do**: Book calendar slots for partner calls
- **Complete**: Click "Complete" after scheduling

## Current Status & What's Missing

### ✅ What Works Now:
- Creating runs from templates
- Viewing run steps
- Marking steps as pending/in_progress/completed/skipped
- Progress tracking
- Run completion

### ❌ What's Missing (Being Fixed):
- **Steps are not actionable** - Currently just checkboxes
- **No data shown** - Review steps don't show actual partnerships/emails
- **No action interfaces** - Email steps don't open composer, stage update steps don't show partnerships
- **UI theme mismatch** - Using dark theme instead of light theme

### 🔧 What We're Adding:
1. **Interactive Step Components**:
   - Review steps → Show actual data (partnerships, emails, etc.)
   - Email steps → Email composer interface
   - Update stage steps → Partnership list with stage dropdowns
   - Create task steps → Task creation form
   - Note steps → Text area for notes

2. **Smart Data Loading**:
   - Steps automatically fetch relevant data based on actionType and config
   - Example: "Review at-risk partnerships" automatically loads partnerships with 14+ days since contact

3. **Action Execution**:
   - Steps can actually perform actions (send emails, update stages, create tasks)
   - Actions are logged automatically
   - Results are saved in step.result

## How to Use Runs Effectively

### Best Practices:
1. **Start with templates** - Use pre-built templates for common tasks
2. **Follow the steps in order** - Steps are designed to build on each other
3. **Complete steps fully** - Don't just mark complete, actually do the work
4. **Add outcome notes** - Document what was accomplished when completing the run
5. **Use for repetitive tasks** - Runs are perfect for weekly/monthly recurring work

### When to Create Custom Runs:
- You have a specific workflow that's not covered by templates
- You want to combine steps from different templates
- You have a one-time task that needs structure

## Technical Details

### Run Data Structure:
```typescript
{
  id: string;
  name: string;
  description?: string;
  status: 'in_progress' | 'paused' | 'completed' | 'cancelled';
  templateId?: string;
  steps: RunStep[];
  linkedPartnershipIds: string[];
  outcome?: string;
}
```

### Step Data Structure:
```typescript
{
  id: string;
  orderIndex: number;
  title: string;
  description?: string;
  actionType: 'review' | 'email' | 'schedule' | 'update_stage' | 'create_task' | 'note' | 'custom';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  config?: {
    // Step-specific configuration
    // Example: { partnershipIds: [...], filter: {...} }
  };
  result?: {
    // Step execution results
    // Example: { emailsSent: 3, partnershipsUpdated: 5 }
  };
}
```

## Next Steps

After the improvements are complete, Runs will:
1. **Show actual data** for review steps
2. **Provide action interfaces** for email, stage update, task creation steps
3. **Execute actions** and log results automatically
4. **Guide you through** the entire workflow with context

This will make Runs a powerful tool for structured, efficient operational work!
