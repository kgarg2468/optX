# Project-Scoped Data + Simulation Design

Date: 2026-02-25
Status: Approved
Owner: Product + Engineering

## 1) Goal

Enable users to manage multiple projects, each with independent data, scenarios, and simulation results. When opening Data or Simulate tabs, users should first see a project selection view instead of being dropped directly into a single global form.

For this phase, a **Project** is mapped directly to the existing `businesses` record.

## 2) Scope Summary

In scope:
- Project list-first flow on `/data` and `/simulate`
- Create/select/switch/rename/delete project interactions
- URL-scoped project context via `?project=<id>`
- Keep Wizard, Graph Editor, and Saved Scenarios behavior for selected project
- Require explicit scenario selection before running simulation

Out of scope for this phase:
- Global app-wide project selector in TopBar
- New parent `projects` table/entity
- Archive/soft-delete behavior

## 3) Product Decisions (Final)

### Project model
- Project = existing `BusinessData` / `businesses` row.

### Entry behavior
- `/data` and `/simulate` both open to Projects list first.
- No default project auto-selected from list view.
- Sort projects by `updated_at` descending.

### Project creation
- From `/simulate`, `Create Project` redirects to `/data` new-project flow.
- A new project should only exist after first successful save (no placeholder/draft backend row).

### Project metadata in list cards
Show:
- Name
- Industry
- Size
- Last updated
- Counts (`data sources`, `scenarios`)

### Data tab experience after selection
- Keep existing Data tabs (Quick Start + Advanced) as-is.
- Add compact project header with:
  - Project name
  - Switch Project dropdown
  - Back to Projects action
  - Rename action
  - Delete action

### Simulate tab experience after selection
- Keep existing Simulation structure.
- Add same compact project header as `/data`.
- Require explicit scenario selection before Run; no default scenario auto-selected.
- Disable Run until scenario is selected.

### Deletion
- Hard delete entire project.
- Two-step confirmation UX:
  1. Initial delete confirm
  2. Second explicit permanent delete confirm button
- Available from both `/data` and `/simulate` project UIs.
- On success, redirect to dashboard (`/`) with success feedback.

### Unsaved changes on project switch (`/data`)
- If form is dirty and user switches project:
  - Modal: `Discard changes` / `Stay`
  - `Stay` keeps user in current project and preserves progress.

### Deep links
- Use URL query param for active project:
  - `/data?project=<id>`
  - `/simulate?project=<id>`
- For `/scenario/<id>`:
  - Auto-switch active project to scenario’s `businessId` and open editor.

### Backward compatibility
- Existing users with one business see it as one project automatically.
- No migration UI required.

## 4) Architecture and State

## 4.1 Data model
No new top-level entity table in this phase.

Project identity is `businesses.id`.

Existing relationships already support scope:
- `data_sources.business_id -> businesses.id`
- `scenarios.business_id -> businesses.id`
- `simulation_results.business_id -> businesses.id`

## 4.2 Client state
Add `project-store` (Zustand, persisted) with:
- `projects: ProjectSummary[]`
- `activeProjectId: string | null`
- `isLoadingProjects: boolean`
- actions:
  - `loadProjects()`
  - `setActiveProject(id | null)`
  - `renameProject(id, name)`
  - `deleteProject(id)`
  - `clearActiveProject()`

Keep `business-store` and `scenario-store`, but load data/scenarios by selected project context.

## 4.3 URL synchronization
- URL is source of truth for page-scoped active project on `/data` and `/simulate`.
- Store mirrors URL for app-level consistency and cross-component access.
- Invalid `?project=` falls back to Projects list and clears invalid active selection.

## 5) UI Components

New reusable components:
- `ProjectListView`
  - Shared by `/data` and `/simulate`
  - Displays cards + `Create Project`
- `ProjectHeader`
  - Name, switch dropdown, back-to-list, rename, delete
- `DeleteProjectConfirm`
  - Two-step destructive confirmation
- `ProjectSwitchGuard`
  - Unsaved-change modal for `/data`

Behavioral notes:
- `Switch Project` supports both direct dropdown switching and explicit back-to-list flow.
- Keep current visual language; aim for demo-ready polish, not full redesign.

## 6) API Changes

Add project-focused API route(s) with minimal schema disruption.

### `GET /api/project`
Returns project list summaries scoped to default user:
- `id, name, industry, size, updatedAt`
- `dataSourceCount`
- `scenarioCount`

### `PUT /api/project`
Rename project:
- Input: `projectId`, `name`
- Updates `businesses.name`

### `DELETE /api/project?projectId=<id>`
Hard-delete project:
- Deletes `businesses` row
- Cascades to dependent rows (`data_sources`, `scenarios`, `simulation_results`)

Existing routes remain primary:
- `/api/data` for project creation/save and project data retrieval
- `/api/scenario` for scenario CRUD by `businessId`
- `/api/simulate` for simulation execution

## 7) Validation and Safety Rules

### Simulation safety
- UI blocks run until scenario is selected.
- Backend validates selected `scenarioId` belongs to provided `businessId`; reject mismatch with 400.

### Scenario deep-link safety
- When loading `/scenario/<id>`, resolve scenario’s `businessId` and set active project context accordingly.

### Delete safety
- Keep confirmation open if delete request fails.
- Show clear error and do not remove local project entry optimistically.

## 8) Error Handling

- Invalid project query param:
  - Clear active project and show Projects list + feedback.
- Project data load failure:
  - Keep selected project header state, show retryable content error.
- Project list load failure:
  - Show retry UI and empty-safe fallback.
- Unsaved-change switch path:
  - `Stay` preserves current draft state.

## 9) Testing and Demo Verification

## 9.1 Test focus
- Store/unit:
  - Project selection + URL sync
  - Rename and delete state updates
  - Unsaved-change guard paths
- Route/API:
  - `GET/PUT/DELETE /api/project` happy + invalid UUID + not found
  - simulation guard for scenario-business mismatch

## 9.2 Manual demo checklist
- `/data` opens on Projects list
- `/simulate` opens on Projects list
- Selecting a project appends `?project=<id>` and loads scoped content
- Project header visible on both pages
- Run disabled until scenario selected
- Create from simulate redirects to data new-project flow
- Delete requires two confirmations and redirects to dashboard
- Wizard, Graph Editor, Saved Scenarios continue working for selected project
- Direct `/scenario/<id>` opens and auto-switches project context

## 10) Implementation Approach Chosen

Chosen approach: **Shared project context layer + list-first flows**.

Reasoning:
- Lower risk than full workspace redesign
- Cleaner and more maintainable than one-off per-page patches
- Fits demo-ready timeline while preserving current core experiences

## 11) Rollout Notes

- No explicit migration step is required.
- Existing single-business users see a single project card immediately.
- Phase 2 candidate: introduce global TopBar project selector after demo.
