import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSyncedUser } from "@/lib/user-sync";
import { createMessageSchema } from "@/lib/validations";
import { triggerRealtimeEvent } from "@/lib/pusher";

type ParamsInput = { params: Promise<{ expenseId: string }> };

/**
 * GET: Retrieve chat message thread for a specific expense.
 */
export async function GET(req: Request, { params }: ParamsInput) {
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

    // Verify group membership
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

    const messages = await prisma.chatMessage.findMany({
      where: { expenseId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            avatarUrl: true
          }
        }
      }
    });

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error retrieving chat messages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST: Add a new message in the chat thread of an expense.
 */
export async function POST(req: Request, { params }: ParamsInput) {
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

    // Verify group membership
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

    const body = await req.json();
    const validation = createMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { message } = validation.data;

    // Create the message in DB
    const newMessage = await prisma.chatMessage.create({
      data: {
        expenseId,
        userId: currentUser.id,
        message
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            avatarUrl: true
          }
        }
      }
    });

    // Broadcast the new message in real-time to the specific expense-chat channel
    await triggerRealtimeEvent(`expense-chat-${expenseId}`, "new-message", {
      message: newMessage
    });

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error posting chat message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
