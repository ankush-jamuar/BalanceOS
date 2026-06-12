# Performance Audit

## Overview
This audit investigates the sluggish UI and delayed data loading reported during manual end-to-end testing.

## Identified Bottlenecks

### 1. Excessive Refetches (TanStack Query Configuration)
**Finding**: The TanStack Query client relies heavily on default `staleTime` (0), meaning every time a component mounts or regains window focus, it immediately refetches data.
**Impact**: Switching tabs or opening modals triggers multiple redundant backend hits.
**Recommendation**: Increase `staleTime` (e.g. 1-2 minutes) for data that is infrequently mutated. Rely on Pusher real-time events to perform active `queryClient.invalidateQueries(...)` when changes occur, rather than relying on aggressive polling/refetches.

### 2. Missing Real-time Query Invalidations
**Finding**: Because Pusher is not invalidating TanStack queries on data mutation (see Root Cause Analysis #2), users are forced to manually refresh or navigate away and back, creating a perceived sluggishness and terrible UX.
**Impact**: Changes made by other users don't appear; users have to trigger full page unmounts/remounts.
**Recommendation**: Implement a global real-time hook that intercepts Pusher events and immediately triggers query invalidation.

### 3. Prisma Query Inefficiencies
**Finding**: Dashboard summaries compute balances across multiple groups. Right now, it fetches groups and their relations.
**Impact**: As the user's group count grows, the dashboard query time will increase.
**Recommendation**: For the scope of this assignment, index additions on `groupId` and `userId` are already present in the schema, but we should ensure `include` payloads on Prisma queries don't over-fetch unnecessary data (like avatars of non-participants).

### 4. Layout Shifts & Missing Loaders
**Finding**: The UI lacks skeleton loaders for soft state transitions. `isLoading` is handled, but `isFetching` (background refetch) might cause layout jitter if not handled correctly.
**Recommendation**: Add graceful skeleton loaders to `BalancesTab` and `SettlementsTab` specifically during the initial fetch.

## Proposed Actions
1. Configure TanStack Query with a global `staleTime` of 60 seconds.
2. Implement global Pusher invalidation.
3. Review payload sizes in `/api/dashboard/summary`.
