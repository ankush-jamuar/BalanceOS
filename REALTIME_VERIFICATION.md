# Realtime Verification

## Current State Assessment
The assignment requires that all group, expense, member, balance, and settlement updates are delivered in real-time.

**Status: FAIL**
Currently, only the connection status indicator and the Expense Chat are wired correctly to Pusher. 

## Missing Subscriptions
The following areas are missing frontend Pusher subscriptions to invalidate their respective data:

1. **Dashboard Summary**: Missing subscription to `user-[userId]` channel.
2. **Group Expenses List**: Missing subscription to `group-[groupId]` channel (event: `expense-changed`).
3. **Group Balances Tab**: Missing subscription to `group-[groupId]` channel (event: `expense-changed`, `settlement-changed`).
4. **Group Settlements Tab**: Missing subscription to `group-[groupId]` channel (event: `settlement-changed`).
5. **Group Settings (Members)**: Missing subscription to `group-[groupId]` channel (event: `member-changed`).

## Action Plan
1. **Global Realtime Provider**:
   Create a `<RealtimeProvider>` component that wraps the authenticated layout.
   This provider will initialize `pusher-js` and expose it via React Context.

2. **Global User Subscription**:
   Subscribe the user to `user-[currentUserId]`.
   When any event (invite, group change) hits this channel, invalidate `["groups"]` and `["dashboard-summary"]`.

3. **Group-Level Subscriptions**:
   Create a `useGroupRealtime(groupId)` hook used in the `GroupWorkspacePage`.
   It subscribes to `group-[groupId]`.
   On `expense-changed`, invalidate `["group-expenses", groupId]` and `["group-balances", groupId]`.
   On `settlement-changed`, invalidate `["group-settlements", groupId]` and `["group-balances", groupId]`.
   On `member-changed`, invalidate `["group", groupId]` and `["group-balances", groupId]`.

4. **Testing Protocol**:
   After implementation, open two distinct incognito windows with two different users in the same group.
   Perform actions in Window A and verify Window B updates instantly without a refresh.
