# BalanceOS — Route Map & API Inventory

This document outlines all user-facing pages and Route Handler endpoints, their authentication rules, ownership checks, payloads, and response structures.

---

## 🖥️ Frontend Page Routes

All page routes (except Public ones) are protected by the Clerk middleware. If an unauthenticated user visits a protected path, they are automatically redirected to Clerk's sign-in page.

| Path | Access | Purpose | Layout Details |
| :--- | :--- | :--- | :--- |
| `/` | Public | Brand marketing & onboarding | Hero gradient headers, feature grids, CTA sign-in button. |
| `/sign-in` | Public | Authentication | Clerk `<SignIn />` widget. |
| `/sign-up` | Public | Authentication | Clerk `<SignUp />` widget. |
| `/dashboard` | Protected | User Workspace Hub | Balance cards, active groups grid, recent global activity, Cmd+K trigger. |
| `/groups/new` | Protected | Create a Group | Title, description, currency configuration forms. |
| `/groups/[groupId]` | Protected | Group detail workspace | Three-tab interface (Expenses list, Balances & Matches, Settlements history). |
| `/groups/[groupId]/expenses/[expenseId]` | Protected | Expense Detail & Chat | Left: split chart, payer, description. Right: live real-time chat sync. |
| `/settings` | Protected | Profile Settings | Settings UI / Clerks user panel. |

---

## 🔌 API Route Handlers (`/api/...`)

Every API endpoint enforces authentication: requests must carry a valid Clerk session token. If missing, it returns a `401 Unauthorized` JSON response.

### 1. Clerk User Sync
#### `POST /api/webhooks/clerk`
* **Auth**: Public (signature verified via Svix keys).
* **Payload**: Clerk Webhook JSON body.
* **Success Response (`200 OK`)**:
  ```json
  "Webhook processed successfully."
  ```
* **Error States**:
  * `400 Bad Request`: Missing Svix headers or failed signature verification.
  * `500 Internal Server Error`: `CLERK_WEBHOOK_SECRET` not set in environment.

---

### 2. User Profiles
#### `GET /api/users/search?query=xxx`
* **Auth**: Protected.
* **Query Params**: `query` (string, min length 1).
* **Success Response (`200 OK`)**:
  ```json
  {
    "users": [
      {
        "id": "uuid-string",
        "email": "user@example.com",
        "username": "username_val",
        "fullName": "First Last",
        "avatarUrl": "https://img.clerk.com/..."
      }
    ]
  }
  ```
* **Error States**:
  * `401 Unauthorized` (Session missing).
  * `500 Internal Server Error`.

---

### 3. Group Management
#### `GET /api/groups`
* **Auth**: Protected.
* **Success Response (`200 OK`)**:
  ```json
  {
    "groups": [
      {
        "id": "group-uuid",
        "name": "Roommates",
        "description": "Shared flat utilities",
        "currency": "EUR",
        "ownerId": "user-uuid",
        "createdAt": "2026-06-12T00:00:00.000Z",
        "updatedAt": "2026-06-12T00:00:00.000Z",
        "owner": { "id": "user-uuid", "fullName": "Alex", "avatarUrl": "..." },
        "members": [
          { "id": "membership-uuid", "userId": "user-uuid", "role": "OWNER" }
        ]
      }
    ]
  }
  ```

#### `POST /api/groups`
* **Auth**: Protected.
* **Payload**:
  ```json
  {
    "name": "Flatmates",
    "description": "Optional flatmate expenses desc",
    "currency": "USD"
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "group": {
      "id": "group-uuid",
      "name": "Flatmates",
      "description": "Optional flatmate expenses desc",
      "currency": "USD",
      "ownerId": "user-uuid",
      "createdAt": "2026-06-12T00:00:00.000Z",
      "updatedAt": "2026-06-12T00:00:00.000Z",
      "members": [
        { "id": "membership-uuid", "groupId": "group-uuid", "userId": "user-uuid", "role": "OWNER" }
      ]
    }
  }
  ```
* **Error States**:
  * `400 Bad Request`: Validation issues (Zod validations: name min 2 chars, currency must be 3 letters).

#### `GET /api/groups/[groupId]`
* **Auth**: Protected (must be a registered member of the group).
* **Success Response (`200 OK`)**: Group details + members + owner profiles.

#### `PATCH /api/groups/[groupId]`
* **Auth**: Protected (caller must be the **OWNER** of the group).
* **Payload**:
  ```json
  {
    "name": "New Flatmates Name",
    "description": "Updated description"
  }
  ```
* **Success Response (`200 OK`)**: Updated group object.
* **Error States**:
  * `403 Forbidden`: Caller is a MEMBER, not the OWNER.
  * `404 Not Found`: Group does not exist.

#### `DELETE /api/groups/[groupId]`
* **Auth**: Protected (caller must be the **OWNER** of the group).
* **Success Response (`200 OK`)**:
  ```json
  { "message": "Group deleted successfully." }
  ```
* **Error States**:
  * `403 Forbidden`: Caller is not OWNER.

#### `POST /api/groups/[groupId]/members`
* **Auth**: Protected (caller must be group **OWNER**).
* **Payload**:
  ```json
  { "email": "friend@example.com" } // OR { "username": "friend_handle" }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "member": {
      "id": "membership-uuid",
      "groupId": "group-uuid",
      "userId": "friend-uuid",
      "role": "MEMBER",
      "user": { "id": "friend-uuid", "fullName": "Friend", "avatarUrl": "..." }
    }
  }
  ```
* **Error States**:
  * `400 Bad Request`: User already exists in the group or invalid search input.
  * `404 Not Found`: Target user is not registered in the application.

#### `DELETE /api/groups/[groupId]/members/[memberId]`
* **Auth**: Protected (caller must be group **OWNER**).
* **Success Response (`200 OK`)**:
  ```json
  { "message": "Member removed successfully." }
  ```
* **Error States**:
  * `400 Bad Request`: Payer is the OWNER (cannot delete owner) OR member has an active net balance != `0` in the group.
  * `404 Not Found`: Membership ID not found in group.

---

### 4. Expense Tracking
#### `POST /api/expenses`
* **Auth**: Protected (caller must be a group member).
* **Payload**:
  ```json
  {
    "groupId": "group-uuid",
    "title": "Groceries",
    "description": "Weekly food bill",
    "amount": 3000, // stored in cents ($30.00)
    "paidByUserId": "user-uuid-who-paid",
    "splitMethod": "EQUAL", // EQUAL | UNEQUAL | PERCENTAGE | SHARES
    "splits": [
      { "userId": "user-uuid-1" },
      { "userId": "user-uuid-2" }
    ]
  }
  ```
* **Success Response (`201 Created`)**: Expense details + splits arrays.
* **Error States**:
  * `400 Bad Request`: Zod validation errors, unequal splits sum mismatch, or splits list not summing to 100%.
  * `403 Forbidden`: Caller not in group.

#### `GET /api/groups/[groupId]/expenses?page=1&limit=10`
* **Auth**: Protected (member of group).
* **Query Params**: `page` (default 1), `limit` (default 10).
* **Success Response (`200 OK`)**:
  ```json
  {
    "expenses": [...],
    "totalCount": 25,
    "nextPage": 2,
    "page": 1
  }
  ```

#### `GET /api/expenses/[expenseId]`
* **Auth**: Protected (member of group containing expense).
* **Success Response (`200 OK`)**: Detailed expense metadata + splits array.

#### `PATCH /api/expenses/[expenseId]`
* **Auth**: Protected (member of group).
* **Payload**: Editable fields (title, description, amount, splitMethod, splits).
* **Success Response (`200 OK`)**: Updated expense metadata + updated splits.
* **Error States**:
  * `400 Bad Request`: Validation failure.

#### `DELETE /api/expenses/[expenseId]`
* **Auth**: Protected (caller must be the expense creator, the payer, or the group owner).
* **Success Response (`200 OK`)**:
  ```json
  { "message": "Expense deleted successfully." }
  ```
* **Error States**:
  * `403 Forbidden`: Caller lacks deleting rights.

---

### 5. Dynamic Balances & Summary
#### `GET /api/groups/[groupId]/balances`
* **Auth**: Protected (member of group).
* **Success Response (`200 OK`)**:
  ```json
  {
    "balances": [
      {
        "user": { "id": "user-uuid-1", "fullName": "Alex", "avatarUrl": "..." },
        "netBalance": 1500 // Alex is owed $15.00
      },
      {
        "user": { "id": "user-uuid-2", "fullName": "Bob", "avatarUrl": "..." },
        "netBalance": -1500 // Bob owes $15.00
      }
    ],
    "suggestedPayments": [
      {
        "fromUser": { "id": "user-uuid-2", "fullName": "Bob", "avatarUrl": "..." },
        "toUser": { "id": "user-uuid-1", "fullName": "Alex", "avatarUrl": "..." },
        "amount": 1500
      }
    ]
  }
  ```

#### `GET /api/dashboard/summary`
* **Auth**: Protected.
* **Success Response (`200 OK`)**:
  ```json
  {
    "totalOwed": 1500,
    "totalReceivable": 0,
    "netBalance": -1500,
    "activeGroupsCount": 3,
    "activities": [
      {
        "id": "activity-uuid",
        "type": "EXPENSE",
        "title": "Groceries",
        "amount": 3000,
        "groupName": "Flatmates",
        "groupId": "group-uuid",
        "date": "2026-06-12T14:00:00.000Z",
        "user": "Alex"
      }
    ]
  }
  ```

---

### 6. Settlements
#### `POST /api/settlements`
* **Auth**: Protected (caller must belong to the group).
* **Payload**:
  ```json
  {
    "groupId": "group-uuid",
    "payerUserId": "user-uuid-1", // who is paying
    "receiverUserId": "user-uuid-2", // who is receiving
    "amount": 1500, // in cents ($15.00)
    "note": "Settle for flat groceries"
  }
  ```
* **Success Response (`201 Created`)**: Created Settlement record.
* **Error States**:
  * `400 Bad Request`: Payer or Receiver not in group, negative amount.

#### `GET /api/groups/[groupId]/settlements?page=1&limit=10`
* **Auth**: Protected (member of group).
* **Success Response (`200 OK`)**: Paginated list of recorded payments.

---

### 7. Discussion Thread
#### `GET /api/expenses/[expenseId]/messages`
* **Auth**: Protected (member of group).
* **Success Response (`200 OK`)**:
  ```json
  {
    "messages": [
      {
        "id": "message-uuid",
        "expenseId": "expense-uuid",
        "userId": "user-uuid",
        "message": "Did you buy organic milk?",
        "createdAt": "2026-06-12T14:10:00.000Z",
        "user": { "id": "user-uuid", "fullName": "Bob", "avatarUrl": "..." }
      }
    ]
  }
  ```

#### `POST /api/expenses/[expenseId]/messages`
* **Auth**: Protected (member of group).
* **Payload**:
  ```json
  { "message": "Yes, it was on discount." }
  ```
* **Success Response (`201 Created`)**: Message details + user profiles. (Triggers Pusher broadcast to `expense-chat-[expenseId]` channel).
