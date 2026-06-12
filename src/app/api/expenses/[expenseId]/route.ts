import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSyncedUser } from "@/lib/user-sync";
import { updateExpenseSchema } from "@/lib/validations";
import {
  calculateEqualSplits,
  calculateUnequalSplits,
  calculatePercentageSplits,
  calculateSharesSplits
} from "@/lib/split-utils";
import { triggerRealtimeEvent } from "@/lib/pusher";

type ParamsInput = { params: Promise<{ expenseId: string }> };

/**
 * GET: Retrieve details for a specific expense.
 */
export async function GET(req: Request, { params }: ParamsInput) {
  try {
    const currentUser = await getOrCreateSyncedUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { expenseId } = await params;

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        paidByUser: {
          select: { id: true, email: true, username: true, fullName: true, avatarUrl: true }
        },
        splits: {
          include: {
            user: {
              select: { id: true, email: true, username: true, fullName: true, avatarUrl: true }
            }
          }
        }
      }
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found." }, { status: 404 });
    }

    // Verify user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: expense.groupId,
          userId: currentUser.id
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this group." }, { status: 403 });
    }

    return NextResponse.json({ expense }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching expense:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PATCH: Edit expense details and recalculate splits atomically.
 */
export async function PATCH(req: Request, { params }: ParamsInput) {
  try {
    const currentUser = await getOrCreateSyncedUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { expenseId } = await params;

    const existingExpense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { splits: true }
    });

    if (!existingExpense) {
      return NextResponse.json({ error: "Expense not found." }, { status: 404 });
    }

    // Verify user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: existingExpense.groupId,
          userId: currentUser.id
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this group." }, { status: 403 });
    }

    const body = await req.json();
    const validation = updateExpenseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { title, description, amount, paidByUserId, splitMethod, splits } = validation.data;

    // Determine values to update (fallback to existing values if not provided)
    const finalAmount = amount !== undefined ? amount : existingExpense.amount;
    const finalSplitMethod = splitMethod !== undefined ? splitMethod : existingExpense.splitMethod;
    const finalPaidByUserId = paidByUserId !== undefined ? paidByUserId : existingExpense.paidByUserId;

    let finalCalculatedSplits: { userId: string; amountOwed: number }[] = [];

    // Recalculate splits if amount, splits configuration, or splitMethod changes
    if (amount !== undefined || splitMethod !== undefined || splits !== undefined) {
      const targetSplits = splits || existingExpense.splits.map(s => ({
        userId: s.userId,
        value: s.percentageValue?.toNumber() || s.sharesValue?.toNumber() || s.amountOwed
      }));

      const participantUserIds = targetSplits.map(s => s.userId);

      // Verify participants are group members
      const existingMembersCount = await prisma.groupMember.count({
        where: {
          groupId: existingExpense.groupId,
          userId: { in: participantUserIds }
        }
      });

      if (existingMembersCount !== participantUserIds.length) {
        return NextResponse.json({ error: "One or more participants are not members of this group." }, { status: 400 });
      }

      try {
        if (finalSplitMethod === "EQUAL") {
          finalCalculatedSplits = calculateEqualSplits(finalAmount, participantUserIds);
        } else if (finalSplitMethod === "UNEQUAL") {
          finalCalculatedSplits = calculateUnequalSplits(finalAmount, targetSplits);
        } else if (finalSplitMethod === "PERCENTAGE") {
          finalCalculatedSplits = calculatePercentageSplits(finalAmount, targetSplits);
        } else if (finalSplitMethod === "SHARES") {
          finalCalculatedSplits = calculateSharesSplits(finalAmount, targetSplits);
        }
      } catch (calcError: unknown) {
        const msg = calcError instanceof Error ? calcError.message : "Invalid split details.";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }

    // Run updates in a Database Transaction block
    const updatedExpense = await prisma.$transaction(async (tx) => {
      // Update basic details of the Expense
      await tx.expense.update({
        where: { id: expenseId },
        data: {
          title: title !== undefined ? title : existingExpense.title,
          description: description !== undefined ? description : existingExpense.description,
          amount: finalAmount,
          paidByUserId: finalPaidByUserId,
          splitMethod: finalSplitMethod
        }
      });

      // If splits were recalculated, replace them
      if (finalCalculatedSplits.length > 0) {
        // Delete existing splits
        await tx.expenseSplit.deleteMany({
          where: { expenseId }
        });

        // Insert new splits
        const newSplitsData = finalCalculatedSplits.map(split => {
          const originalInput = splits?.find(s => s.userId === split.userId);
          return {
            expenseId,
            userId: split.userId,
            amountOwed: split.amountOwed,
            percentageValue: finalSplitMethod === "PERCENTAGE" ? (originalInput?.value || null) : null,
            sharesValue: finalSplitMethod === "SHARES" ? (originalInput?.value || null) : null
          };
        });

        await tx.expenseSplit.createMany({
          data: newSplitsData
        });
      }

      return tx.expense.findUnique({
        where: { id: expenseId },
        include: {
          splits: {
            include: {
              user: {
                select: { id: true, fullName: true, avatarUrl: true }
              }
            }
          },
          paidByUser: {
            select: { id: true, fullName: true, avatarUrl: true }
          }
        }
      });
    });

    if (!updatedExpense) {
      throw new Error("Failed to retrieve the updated expense.");
    }

    // Trigger Pusher update
    await triggerRealtimeEvent(`group-${existingExpense.groupId}`, "expense-changed", {
      action: "update",
      expenseId
    });

    return NextResponse.json({ expense: updatedExpense }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error updating expense:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE: Remove an expense.
 */
export async function DELETE(req: Request, { params }: ParamsInput) {
  try {
    const currentUser = await getOrCreateSyncedUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { expenseId } = await params;

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId }
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found." }, { status: 404 });
    }

    // Verify user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: expense.groupId,
          userId: currentUser.id
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this group." }, { status: 403 });
    }

    // Only expense creator, payer, or group owner can delete it
    const group = await prisma.group.findUnique({ where: { id: expense.groupId } });
    const isAllowed = 
      expense.createdByUserId === currentUser.id || 
      expense.paidByUserId === currentUser.id || 
      group?.ownerId === currentUser.id;

    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to delete this expense." }, { status: 403 });
    }

    // Execute atomic deletion transaction (cascades automatically delete splits & messages)
    await prisma.$transaction(async (tx) => {
      await tx.expense.delete({
        where: { id: expenseId }
      });
    });

    // Trigger Pusher update
    await triggerRealtimeEvent(`group-${expense.groupId}`, "expense-changed", {
      action: "delete",
      expenseId
    });

    return NextResponse.json({ message: "Expense deleted successfully." }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error deleting expense:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
