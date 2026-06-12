# BalanceOS - 3-Day Build Plan

This build plan outlines the execution schedule for constructing BalanceOS from the specifications defined in [AI_CONTEXT.md](file:///d:/BalanceOS/AI_CONTEXT.md).

---

## 📅 Day 1: Project Scaffolding, DB Schema, & Auth Sync

### 1. Bootstrapping Next.js 15
* Initialize Next.js in the workspace root with TypeScript, Tailwind CSS, App Router, and src/ directory structure.
* Install dependency packages:
  - `@clerk/nextjs` (Authentication)
  - `@prisma/client`, `prisma` (ORM & Database Client)
  - `pusher`, `pusher-js` (Realtime events)
  - `@tanstack/react-query` (Data fetching & caching)
  - `framer-motion` (Aesthetics & Animations)
  - `zod`, `react-hook-form` (Schema Form Validation)
  - `lucide-react` (Icons)
  - `shadcn/ui` components (buttons, input, dialogue, select, tabs, cards, dropdowns, etc.)
* Set up dark-mode configuration, global css styles, typography, and base theme HSL colors (emerald, rose, violet focus ring).

### 2. Database Models & Schema Definition
* Configure Prisma with PostgreSQL in `prisma/schema.prisma`.
* Create schema tables: `User`, `Group`, `GroupMember`, `Expense`, `ExpenseSplit`, `Settlement`, and `ChatMessage`.
* Apply database constraints:
  - Composite unique constraint `(groupId, userId)` on the `GroupMember` join table to prevent duplicate memberships.
  - Query performance indexes on `Expense(groupId)`, `ExpenseSplit(userId, expenseId)`, and `Settlement(groupId, payerUserId, receiverUserId)`.
* Generate Prisma Client and run database migrations.

### 3. Authentication & Profile Synchronization
* Configure Clerk middleware and route protections.
* Implement Clerk webhook route handler (`/api/webhooks/clerk`) to handle `user.created`, `user.updated`, and `user.deleted` events.
* Implement a profile verification utility that automatically syncs Clerk users to the database on landing/dashboard routes if the webhook hasn't fired yet. Include a lightweight dashboard loading overlay while checking.

---

## 📅 Day 2: Core Calculations, API Endpoints, & Real-time Server

### 1. Mathematics & Calculation Library
* Implement split calculation rules (Equal, Unequal, Percentage, Shares) inside a utility library (`src/lib/split-utils.ts`).
* Write and run unit tests to verify:
  - Equal split remainder distributions (e.g., $10.00 split among 3 users resulting in $3.34, $3.33, $3.33 allocated sequentially).
  - Net balance calculation formula.
  - Creditor-debtor matching algorithm (direct balance settlement logic).

### 2. Next.js API Route Handlers
* **User Search API**: `/api/users/search` (Search registered users by email or username).
* **Group Management APIs**:
  - `POST /api/groups` (Create group with name, description, selected currency, Zod schema validation)
  - `GET /api/groups` (List user's active groups)
  - `POST /api/groups/[groupId]/members` (Add members, validate query existence)
  - `DELETE /api/groups/[groupId]/members/[memberId]` (Remove member with zero-balance constraint check logic)
* **Expense APIs**:
  - `POST /api/expenses` (Log expense, validate Zod schema. Wrap insert of Expense and ExpenseSplit in a **Prisma Database Transaction** block. Distribute rounding remainders. Emit Pusher update)
  - `PATCH /api/expenses/[expenseId]` (Edit details/recalculate splits inside transaction. Emit Pusher update)
  - `DELETE /api/expenses/[expenseId]` (Remove records inside transaction. Emit Pusher update)
  - `GET /api/groups/[groupId]/expenses` (List paginated expenses)
* **Balances API**: `/api/groups/[groupId]/balances` (Retrieve dynamic net balances and matched debt resolution instructions).
* **Settlements API**: `POST /api/settlements` (Record a pay-off payment, validate Zod schema, emit Pusher update).
* **Chat Message APIs**: `/api/expenses/[expenseId]/messages` (Post and fetch chat history).

### 3. Real-time Integration (Pusher Server-Side)
* Setup Pusher server instance helper.
* Integrate Pusher triggers in write operations (expense additions/updates, settlements, member alterations, chat posts) to broadcast updates to clients.

---

## 📅 Day 3: Premium UI Screens & Interactive Collaboration

### 1. Brand Identity & Landing Page
* Build an immersive landing page (`/`) featuring deep dark gradients, glassmorphic layout elements, animated feature showcases, and interactive dashboard mock previews.
* Configure Clerk login/signup routing views.

### 2. Global Polish: Skeletons, Keyboard Navigation & Forms
* Implement **Raycast-style Cmd+K Command Menu** for rapid navigation, searching groups, and creating new workspaces.
* Implement bottom-sheet drawers using Framer Motion for mobile form displays, and modals for desktop form displays.
* Create high-fidelity loading skeletons utilizing CSS shimmer pulse animations.
* Set up accessible focus rings, semantic markup, and aria roles.

### 3. User Dashboard Page
* Build the `/dashboard` route layout:
  - Responsive grids displaying total outstanding balances (owed/receivable/net) and active groups.
  - Elegant empty state view with illustration and actionable call to create the first group.
  - Dynamic activity feeds log.
  - Drawer/Modal workflows for group creation and settlements with success micro-animations.

### 4. Interactive Group Workspace
* Build the `/groups/[groupId]` tabbed viewport:
  - **Expenses Tab**: Dynamic listing of group transactions with add/edit/delete triggers. Detailed loading skeleton and empty state guides.
  - **Balances & Members Tab**: Grid of group members, current net balances (color-coded green/red), a list of suggested transactions to settle all debts, and options for adding/removing members.
  - **Settlements Tab**: Transaction logs documenting logged payments.
* **Post-MVP AI Insights Card**: Render the AI insights component with custom mock triggers demonstrating natural language analytics (Food categories, frequent settlers, travel ratios).

### 5. Expense Detail Workspace & Real-time Chat
* Build the `/groups/[groupId]/expenses/[expenseId]` workspace page:
  - Detailed split charts showing who paid and how much each participant owes.
  - Discussion channel rendering real-time message feeds via Pusher client synchronization. Includes optimistic messages update states.

### 6. Deployment & Final QA Check
* Deploy the Next.js application on Vercel.
* Deploy PostgreSQL on Neon.
* Bind environment variables (Clerk keys, DATABASE_URL, Pusher secrets).
* Execute full verification checklist (Auth flow, expense CRUD splits, block member deletions when balances exist, chat reactivity, mobile touch layout).
