import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSyncedUser } from "@/lib/user-sync";
import { createExpenseSchema } from "@/lib/validations";
import {
  calculateEqualSplits,
  calculateUnequalSplits,
  calculatePercentageSplits,
  calculateSharesSplits
} from "@/lib/split-utils";
import { triggerRealtimeEvent } from "@/lib/pusher";

/**
 * POST: Create a new expense with transactional split insertions.
 */
export async function POST(req: Request) {
  try {
    const currentUser = await getOrCreateSyncedUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = createExpenseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { groupId, title, description, amount, paidByUserId, splitMethod, splits } = validation.data;

    // Check if the current user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: currentUser.id
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this group." }, { status: 403 });
    }

    // Verify all split participants are members of the group
    const participantUserIds = splits.map(s => s.userId);
    const existingMembersCount = await prisma.groupMember.count({
      where: {
        groupId,
        userId: { in: participantUserIds }
      }
    });

    if (existingMembersCount !== participantUserIds.length) {
      return NextResponse.json({ error: "One or more participants are not members of this group." }, { status: 400 });
    }

    // Calculate split allocations based on chosen method
    let calculatedSplits: { userId: string; amountOwed: number }[] = [];
    try {
      if (splitMethod === "EQUAL") {
        calculatedSplits = calculateEqualSplits(amount, participantUserIds);
      } else if (splitMethod === "UNEQUAL") {
        calculatedSplits = calculateUnequalSplits(amount, splits);
      } else if (splitMethod === "PERCENTAGE") {
        calculatedSplits = calculatePercentageSplits(amount, splits);
      } else if (splitMethod === "SHARES") {
        calculatedSplits = calculateSharesSplits(amount, splits);
      }
    } catch (calcError: unknown) {
      const msg = calcError instanceof Error ? calcError.message : "Invalid split details.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Run writing operations in an atomic Prisma Transaction
    const newExpense = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          groupId,
          title,
          description,
          amount,
          paidByUserId,
          splitMethod,
          createdByUserId: currentUser.id
        }
      });

      const splitsData = calculatedSplits.map(split => {
        const originalInput = splits.find(s => s.userId === split.userId);
        return {
          expenseId: expense.id,
          userId: split.userId,
          amountOwed: split.amountOwed,
          percentageValue: splitMethod === "PERCENTAGE" ? originalInput?.value : null,
          sharesValue: splitMethod === "SHARES" ? originalInput?.value : null
        };
      });

      await tx.expenseSplit.createMany({
        data: splitsData
      });

      return tx.expense.findUnique({
        where: { id: expense.id },
        include: {
          splits: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true
                }
              }
            }
          },
          paidByUser: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true
            }
          }
        }
      });
    });

    if (!newExpense) {
      throw new Error("Failed to retrieve the created expense.");
    }

    // Trigger Pusher notification to alert group members to dynamic balance updates
    await triggerRealtimeEvent(`group-${groupId}`, "expense-changed", {
      action: "create",
      expenseId: newExpense.id
    });

    return NextResponse.json({ expense: newExpense }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
