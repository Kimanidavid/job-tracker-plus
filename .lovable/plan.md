# Resume Editor — Section Editing, Order, Smart Chat, Change Review

## 1. Remove "Resume Source" card from the editor

In `src/pages/ResumeBuilder.tsx`, remove the entire **Resume Source** card (the upload + paste + Save-as-Base block in the left column, ~lines 1118–1168). Uploads now happen exclusively from the landing-page "Create New" dialog.

Keep the manual save flow by moving the **Save / Update Base Resume** button into the header bar next to "Download PDF" so users can still persist edits.

## 2. Section-by-section editor

Replace the empty left-column space (where Resume Source was) with a new **Sections** card that lists every section in the live preview order. Each row:

- Section title (editable inline on click).
- **Magic wand icon button** (`Wand2`) → opens a small inline popover with a textarea ("Tell AI what to change in this section…") and a Send button. Calls a new `editSection(sectionId, instruction)` helper that sends only that section's text to the AI and replaces only that section's content.
- **Pencil icon button** → toggles inline manual edit (the section content becomes a `Textarea` saved on blur).
- Visibility toggle + drag-handle (existing behavior preserved).

This replaces today's "edit the whole CV via chat" pattern with targeted section edits, while leaving the global chat assistant for conversation.

## 3. Center the resume + enforce section order

In the right preview column (`liveSections` rendering), apply a deterministic order before render:

```
header → summary → experience → education → skills → custom (everything else, in original order)
```

Add a `orderSections(sections)` helper near `convertAIFormatToSections`. Apply it in:
- `convertAIFormatToSections` return value
- `parseResumeToSections` consumers (wrap `liveSections` with `orderSections(...)`)
- After every AI edit (chat / section edit / format)

For centering, the preview already lives in a `flex justify-center` container; ensure the scaled wrapper uses `transformOrigin: 'top center'` (already set) and add `mx-auto` to the inner div so it stays centered at all zoom levels.

## 4. Fix chat: conversation vs. edit intent

Today every chat message triggers a full-CV rewrite. New behavior:

Add a lightweight client-side intent classifier before calling the AI:

```ts
const EDIT_VERBS = /\b(add|remove|delete|change|update|rewrite|rephrase|fix|improve|tailor|replace|insert|shorten|expand|bold|highlight|move|reorder|reword|optimi[sz]e|make .* (sound|stronger|shorter|longer))\b/i;
const isEditIntent = EDIT_VERBS.test(msg);
```

- **If `isEditIntent` is false** → call a new `chat` action on `resume-ai` that returns conversational text only (advice, feedback, Q&A). Append the assistant's text to the chat — **do not modify `sections`**.
- **If `isEditIntent` is true** → keep current edit pipeline, but also return a short summary message ("Updated the Experience section to add metrics.") and trigger the change-review flow (§5).

In `supabase/functions/resume-ai/index.ts`, add a new `chat` case:

```
systemPrompt: "You are a helpful resume coach. Answer the user's question or give feedback about their CV. Do NOT rewrite the resume. Reply in 1–4 short paragraphs."
userPrompt: `Resume:\n\n${resume}\n\nUser: ${editInstruction}`
```

Also update the existing welcome bubble copy to: *"Ask me for advice, or tell me to add/edit/remove something — I'll only edit when you ask."*

## 5. Highlight AI-edited sections + Keep / Discard

When an AI edit completes (chat-edit or section-edit):

1. Snapshot pre-edit sections into a new state `pendingEdit: { previousSections, changedSectionIds }`.
2. Compute `changedSectionIds` by diffing each new section's `content` vs the previous section by id (or by title for new additions).
3. In `ResumePreview`, accept a new optional prop `highlightedSectionIds?: string[]`. For each section whose id is in that set, wrap its rendered block with a soft yellow background (`background: 'rgba(254, 240, 138, 0.45)'`, `border-left: 3px solid #f59e0b`, `padding-left: 8px`) plus a small floating "AI edited" pill in the top-right of that block.
4. Render a sticky **Review Bar** above the preview while `pendingEdit` exists:
   - Text: *"AI edited N section(s). Keep changes?"*
   - **Keep changes** button → clear `pendingEdit`, mark resume dirty (auto-save base).
   - **Discard** button → `setSections(pendingEdit.previousSections)`, clear `pendingEdit`.

Highlighting clears automatically on Keep/Discard or when the user starts another edit (snapshot is replaced).

## 6. Files touched

- `src/pages/ResumeBuilder.tsx` — remove Resume Source card; add Sections panel with magic-wand & manual edit; add intent classifier; add `pendingEdit` state, Review Bar, Keep/Discard handlers; move Save into header; apply `orderSections`.
- `src/components/ResumePreview.tsx` — accept `highlightedSectionIds` prop; render highlight wrapper + "AI edited" pill.
- `supabase/functions/resume-ai/index.ts` — add `chat` action (advice only, no rewrite).
- `mem://features/ai-resume-builder` — note new section-level editor, ordered sections, conversational chat, change-review highlighting.

## 7. Out of scope

- No DB schema changes.
- No new section types added.
- No undo/redo stack (Review Bar handles single-step revert).
- Layout & Style sections list is kept as-is (drag/visibility); the new Sections panel is the editing surface.
