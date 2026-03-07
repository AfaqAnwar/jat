# JAT — Full Codebase Audit & Refactor Plan

**Date:** March 7, 2026
**Status:** Phases 1-3 COMPLETED. All issues fixed.
**Domain:** justanotherjobtracker.com (GitHub Pages)
**Scope:** Complete repository — Convex backend, React frontend, schema, types, utilities

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Security Issues](#security-issues)
3. [Bugs & Correctness](#bugs--correctness)
4. [DRY Violations](#dry-violations)
5. [Architecture & Organization](#architecture--organization)
6. [Performance Concerns](#performance-concerns)
7. [Type Safety Issues](#type-safety-issues)
8. [Error Handling Gaps](#error-handling-gaps)
9. [Accessibility Gaps](#accessibility-gaps)
10. [Redundant Comments & Code Hygiene](#redundant-comments--code-hygiene)
11. [Refactor Plan](#refactor-plan)
12. [Regression Risk Matrix](#regression-risk-matrix)

---

## Executive Summary

The codebase is well-structured for its size — clean separation between backend modules, a good custom hook pattern (`useAddJob`), and proper use of Convex's reactive queries. The schema is lean, auth checks are consistent, and the UI code is accessible with keyboard support.

However, there are **security concerns** (SSRF, missing ownership verification), **several real bugs** (UTC date handling, falsy coercion, inability to clear fields), **significant DRY violations** (resume pickers, auth boilerplate, type definitions in 3 places), and **performance issues** (inline callbacks causing re-renders, no pagination) that should be addressed before production.

**Severity Legend:**
- **P0 — Critical:** Must fix before production. Security vulnerabilities or data corruption risks.
- **P1 — High:** Bugs or architecture issues that affect correctness or maintainability.
- **P2 — Medium:** DRY violations, performance, or code quality issues.
- **P3 — Low:** Nice-to-have improvements.

---

## Security Issues

### SEC-1: Server-Side Request Forgery (SSRF) in `parseJob.ts` — P0

**File:** `convex/parseJob.ts:90-128`

The `fetchPageText` function fetches any URL the user provides with zero validation. An attacker could:
- Probe internal services: `http://localhost:3000/admin`
- Access cloud metadata: `http://169.254.169.254/latest/meta-data/`
- Use the server as an attack proxy against third-party services

**Fix:** Validate the URL scheme is `https://` (or `http://`), resolve the hostname, and block private/reserved IP ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16). Consider a domain allowlist for known job board domains.

**Regression risk:** Low — adding validation before the fetch call doesn't touch parsing logic.

---

### SEC-2: `resumeId` ownership not verified in `jobs.add` — P0

**File:** `convex/jobs.ts:38-65`

When a `resumeId` is provided to the `add` mutation, it is inserted directly without verifying that the resume belongs to the authenticated user. Convex document IDs are deterministic strings, not cryptographic secrets — an attacker could reference another user's resume by guessing or enumerating IDs.

**Fix:** Before inserting, query the resume by ID and verify `resume.userId === userId`.

**Regression risk:** Low — adds a guard before insert, no logic change.

---

### SEC-3: `storageId` not verified in `resumes.save` — P1

**File:** `convex/resumes.ts:47-67`

After `generateUploadUrl`, the client returns a `storageId`. The `save` mutation doesn't verify this storage ID was actually produced by the current user's upload URL. A malicious client could claim any storage ID.

**Fix:** This is an inherent Convex pattern limitation. Mitigate by verifying the storage file exists (`ctx.storage.getMetadata`) and optionally checking file size/type server-side.

**Regression risk:** Low.

---

### SEC-4: No rate limiting on `parseJob.fromUrl` — P2

**File:** `convex/parseJob.ts:72-86`

The action makes external HTTP requests (to the job URL and to Gemini API) with no throttling. A malicious or buggy client could trigger unbounded external requests and API costs.

**Fix:** Implement Convex rate limiting (via a counter table or `convex-helpers` rate limiter).

**Regression risk:** Low — rate limiting wraps the existing handler.

---

### SEC-5: `console.log` exposes parsed data in production — P3

**File:** `convex/parseJob.ts:178, 217`

Raw AI responses and normalized results are logged unconditionally. In production, these logs may contain sensitive job details and could slow execution.

**Fix:** Remove or gate behind a `DEBUG` environment variable.

**Regression risk:** None.

---

## Bugs & Correctness

### BUG-1: `todayISO()` returns UTC date instead of user's local date — P1

**File:** `src/lib/format-date.ts:19-21`

```typescript
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}
```

`toISOString()` returns the UTC date. A user at 11:30 PM EST on March 6 would get `"2026-03-07"` as their application date. This silently assigns the wrong date to every job added in the evening (for US users).

**Fix:** Use local date components:
```typescript
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
```

**Regression risk:** Low — isolated pure function. Verify any tests that snapshot today's date.

---

### BUG-2: Falsy coercion with `||` drops valid values — P1

**Files:** `convex/jobs.ts:58-62`, `src/lib/use-add-job.ts:62-68, 100-108`

```typescript
sector: args.sector || undefined,
salary: args.salary || undefined,
```

The `||` operator coerces any falsy value to `undefined`. While unlikely with current field types, this is semantically wrong — `""` (empty string) should be treated differently from `undefined` (not provided). More critically, `locationType: args.locationType || undefined` would drop `"onsite"` if it were falsy (it isn't, but the pattern is fragile and misleading).

**Fix:** Use explicit empty-string checks: `args.sector === "" ? undefined : args.sector`. Or use `?? undefined` where `""` should be preserved, and only strip empty strings where intentional.

**Regression risk:** Low — changes the falsy edge case only. Test with empty string inputs.

---

### BUG-3: Cannot clear optional fields via `update` mutation — P1

**File:** `convex/jobs.ts:68-95`

The `update` mutation uses `undefined` to mean "not provided" (Convex strips `undefined` from args). There is no way for a client to explicitly clear a field (e.g., remove a salary). The `filter(val !== undefined)` on line 89 skips undefined values, so `{ salary: undefined }` is a no-op.

**Fix:** Accept a `clearFields: v.optional(v.array(v.string()))` argument, or use a sentinel value like `v.null()` to mean "clear this field." Alternatively, use `v.optional(v.union(v.string(), v.null()))` for nullable fields.

**Regression risk:** Medium — changes the mutation signature. Requires coordinating frontend and backend changes.

---

### BUG-4: `resolveRelativeDate` doesn't handle "today", "yesterday", "just now" — P2

**File:** `convex/lib/normalize.ts` (resolveRelativeDate function)

Common date formats on job postings like "today", "yesterday", "just now", "posted today" are not matched by the regex pattern, which only handles `X [unit]s ago`.

**Fix:** Add cases for these common patterns before the regex match.

**Regression risk:** Low — additive change to existing function.

---

### BUG-5: "Latest resume" assumption relies on implicit sort order — P2

**Files:** `convex/preferences.ts:64`, `src/lib/get-default-resume.ts:13`

```typescript
const latest = resumes[resumes.length - 1];
```

This assumes Convex returns documents in `_creationTime` order, which is the default for index queries but is implicit. If the query or index changes, "latest" could silently become "first."

**Fix:** Use explicit `.order("desc").first()` for the "latest resume" query, or sort by `_creationTime` explicitly.

**Regression risk:** Low.

---

### BUG-6: `resolveRelativeDate` uses UTC dates (server-side) — P2

**File:** `convex/lib/normalize.ts`

`new Date()` in Convex actions runs in UTC. Date arithmetic like "3 days ago" computed server-side will be off by up to 1 day for users in US timezones. Since this is used for `datePosted` (not `dateApplied`), the impact is lower — it's an approximation from AI-parsed relative dates. But it's worth noting.

**Regression risk:** N/A — informational.

---

### BUG-7: Bidirectional coupling between `resumes.ts` and `preferences.ts` — P2

**Files:** `convex/resumes.ts:100-110`, `convex/preferences.ts:53-67`

- `resumes.setDefault` modifies the `userPreferences` table (clears `alwaysUseLatestResume`)
- `preferences.setAlwaysUseLatestResume` modifies the `resumes` table (clears `isDefault` flags)

This creates a circular dependency between modules. If one is refactored without updating the other, the "default resume" invariant silently breaks.

**Fix:** Extract shared logic into a `convex/lib/resume-defaults.ts` helper that both modules call.

**Regression risk:** Medium — logic must be preserved exactly.

---

## DRY Violations

### DRY-1: Auth + ownership boilerplate repeated 11 times — P2

**Files:** `convex/jobs.ts`, `convex/resumes.ts`, `convex/preferences.ts`

Every single mutation/query handler repeats:
```typescript
const userId = await getAuthUserId(ctx);
if (!userId) throw new Error("Not authenticated");
```

And 5 handlers additionally repeat:
```typescript
const doc = await ctx.db.get(id);
if (!doc || doc.userId !== userId) throw new Error("Not found");
```

**Fix:** Create authenticated wrapper functions:
```typescript
async function requireAuth(ctx: QueryCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

async function requireOwnership<T extends { userId: Id<"users"> }>(
  ctx: QueryCtx, tableName: string, id: Id<any>, userId: Id<"users">
): Promise<T> {
  const doc = await ctx.db.get(id);
  if (!doc || doc.userId !== userId) throw new Error("Not found");
  return doc as T;
}
```

**Regression risk:** Low — purely mechanical extraction. Behavior identical.

---

### DRY-2: `LocType` defined independently in 3 places — P2

| Location | Definition |
|----------|-----------|
| `convex/lib/validators.ts:3-7` | `v.union(v.literal("onsite"), v.literal("remote"), v.literal("hybrid"))` |
| `convex/parseJob.ts:14` | `type LocType = "onsite" \| "remote" \| "hybrid"` |
| `src/lib/types.ts:4` | `export type LocType = "onsite" \| "remote" \| "hybrid"` |

**Fix:** In `types.ts`, derive from the schema: `type LocType = NonNullable<Doc<"jobs">["locationType"]>`. Delete the `parseJob.ts` definition and import from a shared location (Convex can import from `types.ts` if it's in the convex folder).

**Regression risk:** None — type-level change only.

---

### DRY-3: `LOC_TYPES` array lacks `satisfies` guard — P2

**File:** `src/lib/types.ts:16`

```typescript
export const LOC_TYPES = ["onsite", "remote", "hybrid"] as const;
```

Unlike `STATUSES` (which has `satisfies readonly Status[]`), `LOC_TYPES` has no compile-time check that it matches the schema. If a fourth location type is added to the validator, this array won't cause a type error.

**Fix:** Add `satisfies readonly LocType[]` (after deriving `LocType` from the schema).

**Regression risk:** None.

---

### DRY-4: Resume picker UI duplicated in 3 places — P2

| Component | File | Pattern |
|-----------|------|---------|
| `AddJobBar` resume popover | `add-job-bar.tsx:62-83` | Lists resumes with check icon, "Default" button |
| `MobileAddButton` resume list | `mobile-add-button.tsx:62-84` | Same pattern, different layout |
| `ResumeCell` / `ModalResumeSelect` | `resume-cell.tsx`, `job-detail-modal.tsx:149-191` | Select-based resume picker |

**Fix:** Extract a shared `<ResumePickerList>` component for the radio-style resume picker (used in add-job flows), and a shared `<ResumeSelect>` component for the dropdown-style picker (used in table/modal). The two patterns are different enough to warrant two components, but each should exist only once.

**Regression risk:** Medium — UI refactor touches multiple components. Test all resume selection flows on desktop and mobile.

---

### DRY-5: `RedirectToLogin` / `RedirectToDashboard` duplicated — P3

**Files:** `src/routes/index.tsx:178-184`, `src/routes/login.tsx:43-49`

Both are identical `useNavigate` + `useEffect` patterns.

**Fix:** Extract `<Redirect to={path} />` component into `src/components/redirect.tsx`.

**Regression risk:** None.

---

### DRY-6: US state abbreviation maps exist on both frontend and backend — P3

**Files:** `convex/lib/normalize.ts:1-20` (`STATE_TO_ABBR`), `src/lib/us-states.ts` (`STATE_NAME_TO_ABBR`)

Same data, different variable names and structures. These can drift if one is updated without the other.

**Fix:** Tolerable given the Convex frontend/backend boundary. Document the duplication. If Convex supports shared modules, unify into one.

**Regression risk:** N/A.

---

## Architecture & Organization

### ARCH-1: Dates stored as strings prevent DB-level operations — P2

**File:** `convex/schema.ts:17-18`

`dateApplied` and `datePosted` are `v.string()` in ISO format. This prevents:
- Indexed range queries (e.g., "jobs applied in the last 30 days")
- DB-level sorting by date (currently sorted by `_creationTime` which approximates but doesn't equal application date)
- Server-side date validation

**Recommendation:** If date-based features are planned, migrate to `v.float64()` (epoch ms). For now, this is acceptable but limits future capability. **Do not migrate before production** — this requires a data migration and coordinated frontend changes.

---

### ARCH-2: No pagination on `jobs.list` — P2

**File:** `convex/jobs.ts:7-35`

`.collect()` fetches ALL jobs for a user. For power users with hundreds of applications, this becomes a performance bottleneck — every reactive update re-fetches the entire set.

**Recommendation:** Acceptable for launch if expected usage is <100 jobs per user. Add pagination when usage data warrants it. Convex's `.paginate()` with `usePaginatedQuery` is the standard solution.

---

### ARCH-3: `salary` stored as display-formatted string — P3

**File:** `convex/schema.ts:14`

Salary is stored as `"$150,000 - $230,000"` (display format). This prevents numeric sorting or filtering.

**Recommendation:** If salary-based features are planned, add `salaryMin`/`salaryMax` numeric fields alongside the display string. **Do not change before production** — current format works for display-only use.

---

### ARCH-4: `location` is a single string but parser returns array — P3

**File:** `convex/schema.ts:15`, `convex/parseJob.ts:21`

The AI parser returns `locations: string[]` but the schema stores one `location: string`. The collapse happens in `use-add-job.ts` via `resolveLocation()` which picks the best match for the user's state.

**Recommendation:** Current behavior is intentional and works. If multi-location display is needed later, add a `locations` array field.

---

### ARCH-5: Missing `.env.example` file — P3

The repo uses 3 environment variables (`VITE_CONVEX_URL`, `CONVEX_SITE_URL`, `GEMINI_API_KEY`) but has no `.env.example` documenting them. New developers must read the code to discover required config.

**Fix:** Create `.env.example` with placeholder values and comments.

**Regression risk:** None.

---

### ARCH-6: Root route missing error/notFound components — P1

**File:** `src/routes/__root.tsx`

No `errorComponent` or `notFoundComponent` is defined. Any uncaught render error results in React's default white screen crash.

**Fix:** Add basic error and not-found components to `createRootRoute`.

**Regression risk:** None — additive only.

---

## Performance Concerns

### PERF-1: Inline callbacks in `JobTable` cause unnecessary re-renders — P2

**File:** `src/components/job-table.tsx:59-83`

Every `DesktopJobRow` receives inline arrow functions:
```typescript
onStatusChange={(status) => void updateJob({ id: job._id, status: status as Status })}
onLocationTypeCycle={() => void updateJob({ ... })}
onResumeChange={(resumeId) => void updateJob({ ... })}
```

These create new function references on every render of `JobTable`, which means every row re-renders when any state changes (e.g., `editingRoleId`). With 50+ jobs, this causes noticeable jank.

**Fix:** Wrap `DesktopJobRow` and `MobileJobRow` in `React.memo`. Since the React Compiler is enabled via Babel plugin, it may already handle this — verify by profiling. If not, stabilize callbacks with `useCallback`.

**Regression risk:** Low — `React.memo` is a transparent optimization. The React Compiler should be handling this automatically — verify it's actually running.

---

### PERF-2: `ResumePreviewLink` creates a Convex subscription per instance — P3

**File:** `src/components/resume-preview-link.tsx`

Each instance calls `useQuery(api.resumes.getUrl, { storageId })`. If 20 jobs use the same resume, this creates 20 subscriptions. Convex deduplicates queries with identical args at the client level, so the actual network impact is minimal, but the subscription management overhead adds up.

**Recommendation:** Acceptable for now. If the table grows large, consider fetching all resume URLs in bulk at the `JobTable` level and passing them down as props.

---

## Type Safety Issues

### TYPE-1: `handleUpdate` loses type safety via `string` field name — P2

**File:** `src/components/job-table.tsx:30-32`

```typescript
const handleUpdate = (id: JobId, field: string, value: string) => {
  void updateJob({ id, [field]: value || undefined });
};
```

`field: string` allows any string, bypassing TypeScript's ability to verify that the field name matches a valid job field. If a field is renamed in the schema, this won't produce a type error.

**Fix:** Type `field` as a union of valid field names:
```typescript
type EditableJobField = "role" | "company" | "salary" | "location" | "dateApplied" | "datePosted" | "sector";
```

**Regression risk:** None — type-level change only.

---

### TYPE-2: `as string` assertion on env var without runtime check — P3

**File:** `src/main.tsx:9`

```typescript
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
```

If the env var is missing, this silently creates a client with `"undefined"` as the URL.

**Fix:** Add a runtime guard before the assertion.

**Regression risk:** None.

---

### TYPE-3: `update` mutation erases type safety with `Record<string, unknown>` — P2

**File:** `convex/jobs.ts:88-93`

```typescript
const updates: Record<string, unknown> = Object.fromEntries(
  Object.entries(fields).filter(([, val]) => val !== undefined),
);
await ctx.db.patch(id, updates);
```

The intermediate `Record<string, unknown>` discards all type information. Convex's runtime validation still catches schema mismatches, but the compiler won't flag errors during refactoring.

**Fix:** Keep the typed `fields` object and use a typed helper to filter undefined values:
```typescript
function filterDefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}
```

**Regression risk:** Low — type-level improvement.

---

## Error Handling Gaps

### ERR-1: No error boundaries anywhere in the app — P1

**Files:** All route and component files

A single unhandled error in any component crashes the entire app (white screen). React 19's error boundaries are essential for production.

**Fix:** Add a root-level error boundary in `__root.tsx` (via TanStack Router's `errorComponent`) and optionally wrap key sections (table, resume manager) with `<ErrorBoundary>` components.

**Regression risk:** None — additive.

---

### ERR-2: `catch` blocks swallow errors silently — P2

| File | Line | Context |
|------|------|---------|
| `use-add-job.ts` | 85 | `catch { setManualEntry(...) }` — error not logged |
| `use-add-job.ts` | 117 | `catch { toast.error(...) }` — error not logged |
| `resume-manager.tsx` | ~68 | Upload error swallowed |

**Fix:** Add `console.error` in all catch blocks to preserve debuggability. Use `catch (err)` syntax.

**Regression risk:** None.

---

### ERR-3: No error feedback for failed GitHub sign-in — P2

**File:** `src/routes/login.tsx:35`

```typescript
onClick={() => void signIn("github")}
```

The promise is voided with no `.catch()`. If the OAuth popup is blocked or the network fails, the user sees no feedback.

**Fix:** Add a catch handler with a toast notification.

**Regression risk:** None.

---

### ERR-4: Delete operations have no error handling — P2

**File:** `src/components/job-table.tsx:34-38`

```typescript
const handleDelete = async (id: JobId) => {
  await removeJob({ id });
  toast.success("Job removed");
};
```

If `removeJob` throws (network error, auth failure), the error propagates unhandled. The success toast would never fire, but no error toast appears either.

**Fix:** Wrap in try/catch with error toast.

**Regression risk:** None.

---

## Accessibility Gaps

### A11Y-1: Resume picker buttons don't convey selected state to screen readers — P3

**Files:** `add-job-bar.tsx:62-83`, `mobile-add-button.tsx:62-84`

The visually-checked resume buttons use a `CheckIcon` for selected state but don't set `aria-pressed` or `aria-checked`. Screen reader users can't determine which resume is selected.

**Fix:** Add `aria-pressed={isSelected}` to each resume button.

---

### A11Y-2: Star (default resume) button uses `title` instead of `aria-label` — P3

**File:** `src/components/resume-manager.tsx`

The star button for setting a resume as default uses `title="Set as default"` but not `aria-label`. Screen readers may not announce the `title` attribute.

**Fix:** Add `aria-label="Set as default resume"`.

---

## Redundant Comments & Code Hygiene

### Overall assessment: The codebase is **clean** on comments.

The vast majority of comments are justified:
- JSDoc on `format-date.ts` functions explains conversion direction
- `/* Spacer for mobile sticky add bar */` explains a non-obvious div
- Comments in `splitRoleAndSector` explain a multi-step algorithm
- `// Clear resumeId from jobs that used this resume` explains cascade intent

**Minor removals:**
- `{/* Desktop upload */}` / `{/* Mobile upload */}` in `resume-manager.tsx` — borderline, but acceptable for section separation.
- No action needed.

### Code hygiene notes:
- `"use client"` directives in `select.tsx`, `dropdown-menu.tsx` — vestigial from shadcn's Next.js defaults. Harmless in Vite but unnecessary. Low priority to clean up.
- `next-themes` import in `sonner.tsx` — works because `useTheme` returns defaults when no provider is present, but conceptually misleading. The app doesn't actually support theme switching.

---

## Refactor Plan

### Phase 1: Pre-Production Critical Fixes (1-2 days)

These are the minimum changes needed before production. Scoped to avoid regression risk.

| ID | Task | Risk | Files |
|----|------|------|-------|
| SEC-1 | Add URL validation to `parseJob.fetchPageText` | Low | `convex/parseJob.ts` |
| SEC-2 | Verify `resumeId` ownership in `jobs.add` | Low | `convex/jobs.ts` |
| BUG-1 | Fix `todayISO()` to use local date | Low | `src/lib/format-date.ts` |
| ERR-1 | Add root error boundary | None | `src/routes/__root.tsx` |
| ARCH-6 | Add `errorComponent`/`notFoundComponent` to root route | None | `src/routes/__root.tsx` |
| SEC-5 | Remove `console.log` from `parseJob.ts` | None | `convex/parseJob.ts` |
| TYPE-2 | Add runtime env var guard in `main.tsx` | None | `src/main.tsx` |

### Phase 2: Bug Fixes & Safety (1-2 days)

| ID | Task | Risk | Files |
|----|------|------|-------|
| BUG-2 | Replace `\|\|` with explicit empty-string checks | Low | `convex/jobs.ts`, `src/lib/use-add-job.ts` |
| ERR-2 | Add `console.error` to all catch blocks | None | `use-add-job.ts`, `resume-manager.tsx` |
| ERR-3 | Handle sign-in errors on login page | None | `src/routes/login.tsx` |
| ERR-4 | Add try/catch to delete operations | None | `job-table.tsx` |
| BUG-4 | Add "today"/"yesterday" handling to `resolveRelativeDate` | Low | `convex/lib/normalize.ts` |
| BUG-5 | Use explicit `.order("desc")` for "latest resume" | Low | `convex/preferences.ts`, `get-default-resume.ts` |

### Phase 3: DRY & Code Quality (2-3 days)

| ID | Task | Risk | Files |
|----|------|------|-------|
| DRY-1 | Extract `requireAuth` / `requireOwnership` helpers | Low | `convex/lib/auth.ts` (new), all convex modules |
| DRY-2 | Derive `LocType` from schema, single source of truth | None | `types.ts`, `parseJob.ts`, `validators.ts` |
| DRY-4 | Extract shared `ResumePickerList` and `ResumeSelect` | Medium | `add-job-bar.tsx`, `mobile-add-button.tsx`, `resume-cell.tsx`, `job-detail-modal.tsx` |
| DRY-5 | Extract `<Redirect>` component | None | `routes/index.tsx`, `routes/login.tsx` |
| TYPE-1 | Type `handleUpdate` field parameter | None | `job-table.tsx` |
| TYPE-3 | Preserve types in `update` mutation filter | Low | `convex/jobs.ts` |
| BUG-7 | Extract shared resume-defaults logic | Medium | `convex/resumes.ts`, `convex/preferences.ts` |

### Phase 4: Future Improvements (Post-Launch)

| ID | Task | Notes |
|----|------|-------|
| ARCH-1 | Migrate dates to numeric timestamps | Requires data migration |
| ARCH-2 | Add pagination to `jobs.list` | When user data grows |
| ARCH-3 | Add structured salary fields | If salary filtering is needed |
| BUG-3 | Support clearing optional fields | Requires mutation API change |
| SEC-3 | Verify storage ID ownership | Complex, low risk in practice |
| SEC-4 | Add rate limiting to parseJob | When abuse becomes a concern |
| PERF-1 | Verify React Compiler handles memoization | Profile with React DevTools |
| A11Y-1/2 | Fix aria attributes on resume pickers | Small targeted fixes |

---

## Regression Risk Matrix

This matrix maps each refactor to the core flows it could affect. Use this to guide testing.

| Core Flow | Affected By | Test Steps |
|-----------|------------|------------|
| **Add job via URL** | SEC-1, BUG-1, BUG-2, DRY-2, ERR-2 | 1. Paste a valid job URL → job appears in table with correct date. 2. Paste an invalid URL → error toast appears. 3. Paste a LinkedIn URL → correctly normalized. |
| **Add job manually** | BUG-2, BUG-3, ERR-2, DRY-4 | 1. Open manual modal → fill all fields → submit → job appears. 2. Submit with missing required fields → validation prevents submit. 3. Submit with empty optional fields → stored as undefined, not empty string. |
| **Edit job inline** | TYPE-1, TYPE-3, BUG-3 | 1. Click a cell → edit → blur → value persists after reload. 2. Clear a salary → field shows empty. 3. Change status → status persists. |
| **Resume attachment** | SEC-2, DRY-4, BUG-5, BUG-7 | 1. Upload a resume → appears in manager. 2. Set as default → star appears, previous default unstars. 3. Toggle "always use latest" → latest resume auto-attaches to new jobs. 4. Delete a resume → jobs retain the resume name as fallback. |
| **Authentication** | DRY-1, ERR-1, ERR-3 | 1. Visit `/` unauthenticated → redirected to `/login`. 2. Sign in via GitHub → redirected to dashboard. 3. Sign out → redirected to login. |
| **Job deletion** | ERR-4 | 1. Delete a job → toast confirms → job removed from table. |
| **State picker** | N/A (no changes planned) | 1. Set state → location auto-resolves for new jobs. 2. Clear state → no location preference. |

---

## Files Not Requiring Changes

The following files are clean and well-structured:
- `convex/auth.ts` — standard Convex auth setup
- `convex/http.ts` — minimal HTTP router
- `src/lib/utils.ts` — standard `cn()` utility
- `src/lib/us-states.ts` — clean data module
- `src/lib/format-file.ts` — simple utilities
- `src/lib/normalize-url.ts` — good URL handling with XSS prevention
- `src/components/status-badge.tsx` — clean config-driven component
- `src/components/status-select.tsx` — focused, correct
- `src/components/editable-cell.tsx` — good accessibility patterns
- `src/components/location-type-icon.tsx` — clean conditional rendering
- `src/components/state-picker.tsx` — well-implemented command palette
- All `src/components/ui/*` files — standard shadcn components
