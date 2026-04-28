# Resume Builder: Cleanup + New Base Resume Flow

## 1. Remove unwanted UI

In `src/pages/ResumeBuilder.tsx` editor top bar (around lines 711–755):

- **Remove** the "Report Bug" button.
- **Remove** the "Tokens left: {chatTokens}" badge.
- **Remove** the "Templates" toggle button.
- **Remove** the entire `showTemplates` panel block (around line 986 onward) and the `showTemplates` state + setter.
- **Remove** the `chatTokens` state and the trailing "Chat tokens left: {chatTokens}" footer text near line 1134.

Layout & Style, Undo/Redo, Download PDF, Hide Assistant, Clear, and Close Chat remain.

## 2. New "Create New" Base Resume flow

Replace the current `openEditorBlank` (which just opens a blank editor) with a **modal dialog** triggered from the landing page "Create New" button.

### Dialog: "Create Base Resume"

Two top tabs/cards inside the dialog:

- **Upload a resume** (default)
  - File input accepting `.pdf`, `.docx`, `.doc`, `.txt`, `.md` (reuse existing `parseUploadedFile`).
  - Drag-and-drop area with the same handler.
- **Start from scratch**
  - Empty content; user fills in the editor directly.

Below the tabs, two shared fields:

- **Job title / role** (required) — used to name the CV (becomes `resumeTitle`, e.g. "Senior Product Manager").
- **Set as base resume** toggle (`Switch`), default ON.

Footer:
- Cancel
- **Continue** button (disabled until job title entered AND, for upload tab, file selected).

### On Continue

1. If upload tab:
   - Run `parseUploadedFile(file)` to extract text → set `resumeContent`.
   - Set `resumeTitle` = job title input.
   - Open the editor view (`setView('editor')`).
   - Immediately run the existing AI `format` call (already wired in `handleFileUpload`) to structure into sections, populate Personal Information form fields, and render in the live preview using the default template.
   - Show a toast: "Parsing & structuring your CV…" then "CV ready".
   - If the toggle was ON, mark `is_base: true` on first save (already the default for `handleSaveBase`); auto-save on entry to persist.
2. If scratch tab:
   - Set `resumeTitle` = job title, blank content, empty sections, open editor.

The existing 3-column editor (left: Analysis + Personal Info + Resume Source; center: AI chat; right: Live Preview) is reused — the upload result flows straight into it, so the user sees the structured preview immediately.

### Replace the inline "Resume Source" upload card?

Keep it in the editor (still useful for replacing the file later), but remove the duplicate redundant copy if any. No structural change beyond that.

## 3. Wiring summary

State to add:
- `createDialogOpen: boolean`
- `createMode: 'upload' | 'scratch'`
- `newJobTitle: string`
- `newSetAsBase: boolean` (default true)
- `pendingFile: File | null`

Functions to add:
- `openCreateDialog()` — opens modal, resets state.
- `handleCreateContinue()` — orchestrates the two paths above, then calls existing parsing + AI format pipeline.

Landing page "Create New" button (line ~488) calls `openCreateDialog()` instead of `openEditorBlank`.

## 4. Files touched

- `src/pages/ResumeBuilder.tsx` — all changes above.
- `mem://features/ai-resume-builder` — update to note: no Templates panel, no token counter, no bug-report button; new base resumes are created via a dialog (upload OR from scratch + job title + set-as-base toggle).

## 5. Out of scope

- No DB schema changes (reuses existing `resumes.title` and `resumes.is_base`).
- Layout & Style panel and template selection logic in `templateToTheme` stay (the default template is still applied to the preview); only the in-editor Templates **picker UI** is removed per the request.
