# BalanceOS - Project Context & Specification

## 1. Product Overview & Goals
BalanceOS is a modern, collaborative expense management platform that helps groups track shared expenses, understand balances, and settle debts transparently. 
The objective is to create a more polished, intuitive, and real-time experience than Splitwise, utilizing modern SaaS design principles, clean balance visualization, and rich interactive micro-animations.

---

## 2. User Personas & MVP Scope

### Target Users
- Friends sharing expenses
- Roommates managing household bills
- Students sharing trips and costs
- Small travel groups and event organizers

### MVP Scope (3-Day Build)
#### Authentication
- Sign up, sign in, and sign out via Clerk.
- Protected page routes and API endpoints.

#### Groups
- Create group (Name, Description, Currency selection).
- View group dashboard and list groups.
- Add members to groups.
- Remove members from groups.

#### Expenses
- Create, Edit, and Delete expenses inside a group.
- View detailed expense breakdowns.
- Supported Split Methods:
  - **Equal**: Split evenly among participants.
  - **Unequal**: Specific monetary amounts per participant.
  - **Percentage**: Percentage shares of the total (must sum to 100%).
  - **Shares**: Number of shares per participant (e.g., 2 shares for Alice, 1 share for Bob).

#### Balances & Debt Calculation
- Personal dashboard summary (Total Owed, Total Receivable, Net Balance, Active Groups).
- Group-level balance summary showing who owes whom and how much.

#### Settlements
- Record a payment between users.
- Mark specific debts as settled.
- View settlement history.

#### Real-time Chat
- Expense-level discussion thread.
- Real-time message synchronization.

### Out of Scope (Explicitly Excluded)
- Multi-currency support (each group uses a single currency; conversion is out of scope).
- Receipt scanning, OCR, or image uploads.
- Email invitations or push notifications.
- Advanced debt simplification algorithms (e.g., Splitwise "simplify debts" graph minimization across multiple groups; we will calculate direct balances).
- Recurring expenses.
- Native mobile application.
- Offline mode.
- Advanced analytics (except as outlined in the Post-MVP AI Insights section).

---

## 3. Core User Workflows
1. **Onboarding**: User lands on landing page -> signs up/in -> redirected to dashboard.
2. **Group Management**: User creates a group -> adds group members -> group list updates.
3. **Expense Logging**: User opens group -> clicks "Add Expense" -> fills in title, description, amount, payer, participants, and split method -> system calculates shares -> saves to db -> updates balances.
4. **Balance Viewing**: User checks dashboard or group details to see running balances.
5. **Settlements**: User settles a debt -> records payment -> balances update.
6. **Expense Discussion**: User opens expense detail page -> enters chat message -> Pusher synchronizes the chat in real time.

---

## 4. Technology Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Next.js Route Handlers (API routes), TypeScript
- **Database**: PostgreSQL (hosted on Neon)
- **ORM**: Prisma
- **Authentication**: Clerk
- **Real-time Engine**: Pusher
- **Deployment**: Vercel (Frontend & Backend), Neon (Database)

---

## 5. Detailed Technical Specifications

### A. Data Model & Schema Details
All monetary values are stored as **integers representing the smallest currency unit** (e.g., $10.00 is stored as `1000`, ₹100.50 as `10500`) to avoid floating-point errors.

#### `User` Table
- `id`: UUID (Primary Key)
- `clerkId`: String (Unique)
- `email`: String (Unique)
- `username`: String (Unique)
- `fullName`: String
- `avatarUrl`: String
- `createdAt`: DateTime
- `updatedAt`: DateTime

#### `Group` Table
- `id`: UUID (Primary Key)
- `name`: String
- `description`: String (Nullable)
- `currency`: String (e.g., 'USD', 'INR', 'EUR')
- `ownerId`: UUID (Foreign Key to `User`)
- `createdAt`: DateTime
- `updatedAt`: DateTime

#### `GroupMember` Table (Join Table for Group and User)
- `id`: UUID (Primary Key)
- `groupId`: UUID (Foreign Key to `Group`)
- `userId`: UUID (Foreign Key to `User`)
- `role`: Enum (`OWNER`, `MEMBER`)
- `createdAt`: DateTime

#### `Expense` Table
- `id`: UUID (Primary Key)
- `groupId`: UUID (Foreign Key to `Group`)
- `title`: String
- `description`: String (Nullable)
- `amount`: Integer (in smallest currency units)
- `paidByUserId`: UUID (Foreign Key to `User`, user who paid)
- `splitMethod`: Enum (`EQUAL`, `UNEQUAL`, `PERCENTAGE`, `SHARES`)
- `createdByUserId`: UUID (Foreign Key to `User`)
- `createdAt`: DateTime
- `updatedAt`: DateTime

#### `ExpenseSplit` Table
- `id`: UUID (Primary Key)
- `expenseId`: UUID (Foreign Key to `Expense`)
- `userId`: UUID (Foreign Key to `User`)
- `amountOwed`: Integer (in smallest currency units)
- `percentageValue`: Decimal (Nullable, for percentage splits)
- `sharesValue`: Decimal (Nullable, for share splits)
- `createdAt`: DateTime

#### `Settlement` Table
- `id`: UUID (Primary Key)
- `groupId`: UUID (Foreign Key to `Group`)
- `payerUserId`: UUID (Foreign Key to `User`, who is paying/settling)
- `receiverUserId`: UUID (Foreign Key to `User`, who is receiving)
- `amount`: Integer (in smallest currency units)
- `note`: String (Nullable)
- `createdByUserId`: UUID (Foreign Key to `User`)
- `createdAt`: DateTime

#### `ChatMessage` Table
- `id`: UUID (Primary Key)
- `expenseId`: UUID (Foreign Key to `Expense`)
- `userId`: UUID (Foreign Key to `User`)
- `message`: String
- `createdAt`: DateTime
- `updatedAt`: DateTime

---

### B. Business Logic & Rules

#### Clerk User Sync
- Primary sync occurs via Clerk Webhooks (`user.created`, `user.updated`, `user.deleted`).
- Fail-safe check: Backend middleware or endpoints check if the user exists in the local DB based on their authenticated Clerk ID. If missing, it creates the record using Clerk session data as a fallback.
- Loading state: If a user reaches the dashboard while webhook processing is pending, show a lightweight loading state while performing the fallback sync, then resume normal operations without showing errors.

#### Group Member Management
- Only the Group Creator (stored as `ownerId` or with role `OWNER`) can add or remove members.
- Members can be added by searching for registered users via email address or username.
- **Member Removal Constraint**: A member cannot be removed if they have outstanding balances in the group. Specifically:
  - Net balance with respect to the group must be exactly `0`.
  - No active unpaid debts or positive receivables within this group.
  - The UI must display a clear explanation and disable the delete/remove button if a balance remains.

#### Equal Split Rounding Strategy
- Calculate base share: `Base = Math.floor(TotalAmount / NumberOfParticipants)`.
- Calculate remainder: `Remainder = TotalAmount - (Base * NumberOfParticipants)`.
- Distribute `Remainder` (1 unit at a time) to the first `Remainder` participants in the split list.
- Example: 1000 cents split among 3 users (User A, User B, User C):
  - Base share = `1000 / 3 = 333` cents.
  - Remainder = `1000 - 999 = 1` cent.
  - Allocated splits: User A gets `334` cents, User B gets `333` cents, User C gets `333` cents.

#### Balance & Debt Calculations
- All balances are calculated **dynamically** from raw database records (`Expense`, `ExpenseSplit`, `Settlement`). No cached balances are kept in the database.
- **Formula for a User's Net Balance (Group or Personal)**:
  `Net Balance = Total Paid - Total Owed + Settlements Received - Settlements Paid`
  - `Net > 0`: User is owed money.
  - `Net < 0`: User owes money.
  - `Net = 0`: User is settled.
- **Single-Group Debt Settlement Flow (Who Owes Whom)**:
  1. Calculate the Net Balance for every member of the group.
  2. Separate members into `Creditors` (Net > 0) and `Debtors` (Net < 0).
  3. Sort both lists in descending order of absolute balances.
  4. Sequentially match Debtors to Creditors:
     - Match the largest debtor with the largest creditor.
     - Create a suggested payment from the debtor to the creditor for `min(|Debtor Balance|, |Creditor Balance|)`.
     - Subtract this amount from both balances, remove anyone whose balance reaches 0, and repeat until all balances are settled.

#### Chat Messages
- Message sync is done through Pusher.
- When a new message is successfully saved to the database, the backend triggers a Pusher event on a channel dedicated to the specific expense (`expense-chat-{expenseId}`).
- Clients listening to the channel append the new message to their state in real time.

---

## 6. UI & Design System (Premium SaaS Focus)

To meet the high polish levels of apps like **Linear**, **Arc**, **Raycast**, and **Vercel**, we adhere to the following principles:

### Theme & Aesthetics
- **Mode**: Dark-mode first design.
- **Inspiration**: Minimal borders, glow effects, monochromatic foundations with colorful indicators.
- **Base Surfaces**:
  - Main Background: Rich charcoal (`#09090b` or HSL `240 10% 3.9%`).
  - Cards & Modals: Slate surfaces (`#18181b` or HSL `240 5.9% 10%`), thin border (`#27272a` or HSL `240 4.8% 15.9%`) with 1px border-radius structure.
- **Accent Palette**:
  - Green (Credits): HSL `142.1 70.6% 45.3%` (Emerald) - glowing text, clean badges.
  - Red (Debts): HSL `346.8 77.2% 49.8%` (Rose) - soft, low-saturated warning text.
  - Violet (Interactions): HSL `262.1 83.3% 57.8%` - focus outlines, major CTAs, active selections.

### Premium Interaction Patterns & Animations (Framer Motion)
- **Keyboard Shortcuts (Raycast/Slack Style)**:
  - Global `Cmd+K` / `Ctrl+K` Command Menu to search groups, launch the "+ Create Group" dialog, or navigate home.
  - Esc key to immediately close drawers/dialogs.
- **Micro-Animations**:
  - Hover: Cards slide up by `2px` with a subtle gradient glow border (`transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1)`).
  - Balance Counters: Animate number changes using a rolling ticker effect when recalculated.
  - Modal Transitions: Scale from `95%` to `100%` with opacity fade; drawer sliding up from the bottom with spring physics (`damping: 25`, `stiffness: 250`).
  - Succession Animation: A particle burst or subtle green check glow when an expense is successfully logged or a debt is fully settled.
- **Toasts Stack (Vercel Style)**: Overlapping notifications at the bottom right that expand on hover and collapse smoothly.

### UX States: Skeletons & Empty Views
- **Loading Skeletons (Perceived Performance)**:
  - Placeholders with a dark-to-light gradient shimmer effect (`animate-pulse`).
  - Staggered entrance animation: Cards reveal in sequence (`0.05s` delay between elements) rather than popping in simultaneously.
- **Meaningful Empty States**:
  - **No Groups (Dashboard)**: A dashed-border card with a central visual icon, headline, and contextual copy: *"No active groups found. Bring clarity to shared bills by creating your first workspace."* plus a primary "+ New Group" button.
  - **No Expenses (Group Details)**: A timeline template outlining example steps, showing: *"This group has no transaction history yet. Add an expense to divide the costs equally, by shares, or by percentage."*
  - **Empty Chat Thread (Expense Detail)**: A clean empty view with the prompt: *"Ask a question, add clarification, or post a receipt link to start the discussion."*

### Accessibility & Responsiveness Requirements
- **Contrast & Font**: Ensure all texts meet WCAG 2.1 AA guidelines (at least 4.5:1 ratio). Utilize premium fonts (e.g., `Geist Sans` or `Inter`) with precise subpixel antialiasing.
- **Screen Readers & Keyboard Focus**: Focus rings using violet outlines on tab navigation. Interactive structures must use semantic tags (`<button>`, `<dialog>`) with appropriate `aria-expanded`, `aria-selected`, and `role="tablist"` attributes.
- **Mobile Drawer Patterns**:
  - On desktop, forms (e.g., Add Expense, Add Member) render in floating centered modals.
  - On mobile, forms render inside bottom-sheet drawers (simulated with Framer Motion) for thumb-friendly interaction.
  - Navigation layouts collapse into tab bars or drawer panels on small screens.

---

## 7. API Validation & Database Integrity Specs

### API Validation Rules (Zod schemas)
1. **Expenses**:
   - `amount` must be a positive integer greater than `0`. Negative expenses are rejected.
   - Splits list must not be empty.
   - Sum of split amounts must exactly equal the total `amount`.
   - Percentage splits must sum to exactly `100.00%`.
   - Shares splits values must be positive decimals greater than `0`.
2. **Groups**:
   - `name` is required (minimum 2 characters, max 50).
   - `currency` must match supported currency lists (e.g., `USD`, `INR`, `EUR`, `GBP`).
3. **Settlements**:
   - `amount` must be greater than `0` and less than or equal to the outstanding debt between the payer and receiver to prevent over-settlement (optional validation or user alert).

### Database Constraints
- **Prisma Transactions**: Creating an `Expense` and its associated `ExpenseSplit` records must execute inside a `prisma.$transaction` block. If split creation fails, the parent expense record is rolled back.
- **Unique Memberships**: A composite unique constraint `(groupId, userId)` must be defined on the `GroupMember` join table to prevent duplicate memberships.

### Concurrency Edge Cases
- If client refetching via Pusher fails due to temporary offline states, the frontend displays a small alert indicator: *"Live connection interrupted. Retrying..."* and falls back to manual polling or pull-to-refresh.

---

## 8. Next.js Routing Structure
Public Routes:
- `/` (Landing Page)
- `/sign-in` (Clerk Sign In)
- `/sign-up` (Clerk Sign Up)

Protected Routes:
- `/dashboard` (Workspace Dashboard)
- `/groups/new` (Group Creation)
- `/groups/[groupId]` (Group Workspace)
- `/groups/[groupId]/expenses/[expenseId]` (Expense Details & Discussion)
- `/settings` (User settings & profile sync)

---

## 9. API Design Specification

### Users
- `GET /api/users/search`: Search users by email or username.

### Groups
- `POST /api/groups`: Create a new group.
- `GET /api/groups`: List all groups for the authenticated user.
- `GET /api/groups/[groupId]`: Fetch group metadata.
- `PATCH /api/groups/[groupId]`: Update group metadata.
- `DELETE /api/groups/[groupId]`: Delete a group.
- `POST /api/groups/[groupId]/members`: Add a member to a group.
- `DELETE /api/groups/[groupId]/members/[memberId]`: Remove a member from a group.

### Expenses
- `POST /api/expenses`: Create a new expense.
- `GET /api/expenses/[expenseId]`: Get details for a specific expense.
- `PATCH /api/expenses/[expenseId]`: Edit an expense.
- `DELETE /api/expenses/[expenseId]`: Delete an expense.
- `GET /api/groups/[groupId]/expenses`: List expenses for a group (paginated).

### Balances
- `GET /api/groups/[groupId]/balances`: Fetch group-level balances and matches.
- `GET /api/dashboard/summary`: Fetch personal dashboard summary.

### Settlements
- `POST /api/settlements`: Record a settlement.
- `GET /api/groups/[groupId]/settlements`: Fetch settlement history for a group (paginated).

### Chat
- `GET /api/expenses/[expenseId]/messages`: List message history for an expense.
- `POST /api/expenses/[expenseId]/messages`: Post a new message.

---

## 10. Post-MVP Feature: AI-Powered Spending Insights

Once core operations are stable, the system will support an AI analysis card on the Group Page and main Dashboard. 

### API Endpoint
- `GET /api/groups/[groupId]/insights` (or `GET /api/dashboard/insights` for global summary)

### UI Representation
- A sleek card with a subtle purple gradient glow border (indicating intelligence/AI features).
- Features natural language insights that analyze transaction patterns dynamically.

### Core Analytics/Insight Examples:
1. **Category/Spending Shifts**: *"Food & Dining expenses increased by 20% compared to last month. Consider review of grocery caps."*
2. **Frequency Trends**: *"You settle most frequently with @username. Let us know if you want to configure a quick-access settlement button on your home feed."*
3. **Distribution Breakdown**: *"Travel & Transit accounts for 45% of total group spending. This represents your highest group cost category this trip."*
4. **Simplification Suggestion**: *"By recording a settlement of $15.00 to User B, you will close out your balance across three active sub-splits."*

---

## 11. Verification & Testing Strategy
- **Unit Testing**: Target core logic in isolation (split math, rounding distribution, dynamic balance calculations, creditor-debtor matching).
- **Manual QA Checklist**:
  - Authentication flows (Clerk onboarding, page protection, fallback webhook sync checks).
  - Group flows (creation with currency selection, member search/addition, member removal constraint verification).
  - Expense flows (Equal, Unequal, Percent, and Share calculations, validations, editing, deletion).
  - Settlement flows (recording payments, balance recalculations).
  - Real-time chat (Pusher synchronization across sessions).
  - UI Responsiveness and animations (Framer Motion transitions, dark mode).
