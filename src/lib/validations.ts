import { z } from "zod";

/**
 * 1. User Search Validation
 */
export const userSearchSchema = z.object({
  query: z.string().min(1, "Search query is required")
});

/**
 * 2. Group Validations
 */
export const createGroupSchema = z.object({
  name: z.string()
    .min(2, "Group name must be at least 2 characters long")
    .max(50, "Group name cannot exceed 50 characters"),
  description: z.string().max(200, "Description cannot exceed 200 characters").optional().nullable(),
  currency: z.string()
    .length(3, "Currency must be a 3-letter code (e.g. USD)")
    .transform(val => val.toUpperCase())
});

export const updateGroupSchema = z.object({
  name: z.string()
    .min(2, "Group name must be at least 2 characters long")
    .max(50, "Group name cannot exceed 50 characters")
    .optional(),
  description: z.string().max(200, "Description cannot exceed 200 characters").optional().nullable()
});

export const addMemberSchema = z.union([
  z.object({
    email: z.string().email("Invalid email address"),
    username: z.string().optional()
  }),
  z.object({
    email: z.string().optional(),
    username: z.string().min(2, "Username must be at least 2 characters")
  })
]);

/**
 * 3. Expense Validations
 */
export const expenseSplitInputSchema = z.object({
  userId: z.string().uuid("Invalid user ID in splits"),
  value: z.number().nonnegative("Value must be a positive number").optional()
});

export const createExpenseSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional().nullable(),
  amount: z.number().int("Amount must be an integer represented in cents").positive("Amount must be greater than 0"),
  paidByUserId: z.string().uuid("Invalid payer user ID"),
  splitMethod: z.enum(["EQUAL", "UNEQUAL", "PERCENTAGE", "SHARES"]),
  splits: z.array(expenseSplitInputSchema).min(1, "At least one participant is required in the splits list")
});

export const updateExpenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long").optional(),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional().nullable(),
  amount: z.number().int("Amount must be an integer represented in cents").positive("Amount must be greater than 0").optional(),
  paidByUserId: z.string().uuid("Invalid payer user ID").optional(),
  splitMethod: z.enum(["EQUAL", "UNEQUAL", "PERCENTAGE", "SHARES"]).optional(),
  splits: z.array(expenseSplitInputSchema).min(1, "At least one participant is required in the splits list").optional()
});

/**
 * 4. Settlement Validations
 */
export const createSettlementSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
  payerUserId: z.string().uuid("Invalid payer user ID"),
  receiverUserId: z.string().uuid("Invalid receiver user ID"),
  amount: z.number().int("Amount must be an integer represented in cents").positive("Amount must be greater than 0"),
  note: z.string().max(100, "Note cannot exceed 100 characters").optional().nullable()
});

/**
 * 5. Chat Message Validations
 */
export const createMessageSchema = z.object({
  message: z.string().min(1, "Message content is required").max(1000, "Message cannot exceed 1000 characters")
});
