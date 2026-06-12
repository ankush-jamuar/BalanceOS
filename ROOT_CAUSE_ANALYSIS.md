# Root Cause Analysis: Critical Stabilization Phase

## 1. Username System Issue
**Symptom**: Users are assigned email-derived usernames and cannot change them.
**Root Cause**: The Clerk webhook sync logic (`api/webhooks/clerk/route.ts`) and manual sync logic (`getOrCreateSyncedUser` in `lib/user-sync.ts`) automatically generate a username using the email prefix or random string. There is no UI flow to allow the user to select their username on first login.
**Verification**: Verified `getOrCreateSyncedUser` in `lib/user-sync.ts` assigns `clerkUser.username || email.split("@")[0] || ...`. Since Clerk email auth doesn't prompt for a username by default, it always falls back.

## 2. Realtime Synchronization Failure
**Symptom**: Dashboard, Groups, and Balances require manual refreshes after changes.
**Root Cause**: While `pusher` is configured and used inside `AppSidebar.tsx` and the Expense Chat, it is *not* used to invalidate TanStack Query caches globally on other pages. The frontend does not subscribe to group-level events outside of the specific components that currently use it, and doesn't trigger `queryClient.invalidateQueries`.
**Verification**: Grepping for `pusher-js` confirms it's only active in `AppSidebar` (connection status) and the `expense/[expenseId]/page.tsx` chat. Group-level events (e.g. `expense-created`) fired from the backend are ignored by the frontend.

## 3. Realtime Provider Audit
**Conclusion**: Pusher itself is functioning correctly and correctly delivering events (as evidenced by the backend triggers and the functional Expense Chat). The failures are purely **event wiring and subscription issues** on the frontend. There is no need to migrate to Ably; we simply need to build a global Pusher subscription hook that listens to user/group events and invalidates TanStack Query caches.

## 4. Exact Split Calculation Bug
**Symptom**: 1000 amount exact split as 300 and 700 yields "1000 cents != 100000 cents".
**Root Cause**: The frontend `AddExpenseModal.tsx` parses the user's exact split inputs as floats (dollars/currency format) but fails to multiply them by 100 before sending the API request. The backend expects `splits[].value` in cents, leading to a mismatched comparison (300 cents + 700 cents = 1000 cents, which does not equal the total expense amount of 100000 cents).
**Verification**: In `AddExpenseModal.tsx` line 213, `value: splitMethod !== "EQUAL" ? parseFloat(splitValues[uid] || "0") : undefined` parses as dollars but doesn't multiply by 100.

## 5. Currency Consistency
**Symptom**: Risk of unit mismatch bugs; users can select currency in UI in ways that conflict with group currency.
**Root Cause**: The application needs to strictly enforce the group's chosen currency for all operations. The backend and frontend must use the `Group.currency` field invariably for all expenses and settlements tied to that group.
**Verification**: Currency is currently correctly stored on the `Group`, but the application needs an audit to remove any rogue currency selectors in expense/settlement forms and ensure pure reliance on the group's currency.

## 6. Dashboard Realtime Updates
**Symptom**: Dashboard doesn't update without a refresh.
**Root Cause**: Same as Issue #2. The Dashboard component lacks a Pusher subscription to listen for the user's groups' events and invalidate the `["dashboard-summary"]` query.

## 7. Performance Investigation (Audit)
*See `PERFORMANCE_AUDIT.md` for full details.*
**Root Cause**: Heavy usage of nested Client Components that fetch data independently without proper `staleTime` caching, leading to excessive refetches. Lack of skeleton loaders during re-fetches causes layout shifts. Prisma queries may lack optimal indexing for heavy relation queries (e.g. dashboard summary).

## 8. Settlement Calculation Bug
**Symptom**: Settlement increases debt instead of decreasing it.
**Root Cause**: In `lib/split-utils.ts`, the `calculateNetBalances` function incorrectly subtracts the settlement amount from the payer's balance (shifting it more negative) and adds it to the receiver's balance (shifting it more positive). Since negative balances represent debt (you owe money), paying a settlement should shift the payer's balance *positive* (reducing debt) and the receiver's balance *negative* (reducing credit). The logic is inverted.
**Verification**: Lines 166-175 in `split-utils.ts` show `netBalances[settlement.payerUserId] -= settlement.amount`, which increases debt.

## 9. Settlement UX
**Symptom**: Confusing UI copy implies money is moving.
**Root Cause**: UI labels use "Record Payment" instead of "Record Settlement", causing user confusion.

## 10. Group Settings Functionality
**Symptom**: Group settings are static.
**Root Cause**: `GroupSettingsDrawer.tsx` has no form to edit the group name or description.
**Verification**: Verified `GroupSettingsDrawer.tsx` lacks mutation logic for `PATCH /api/groups/[groupId]`.

## 11. Expense Chat
**Symptom**: Needs verification.
**Conclusion**: Expense chat is fully functional and uses Pusher for real-time delivery (`expense/[expenseId]/page.tsx`). No critical defects found, but it will be verified end-to-end.

## 12. Assignment Compliance
**Conclusion**: Realtime compliance requires the fixes outlined in #2 and #6.
