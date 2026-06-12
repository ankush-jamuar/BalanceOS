import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSyncedUser } from "@/lib/user-sync";
import { createSettlementSchema } from "@/lib/validations";
import { triggerRealtimeEvent } from "@/lib/pusher";

/**
 * POST: Record a settlement payment.
 */
export async function POST(req: Request) {
  try {
    const currentUser = await getOrCreateSyncedUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = createSettlementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { groupId, payerUserId, receiverUserId, amount, note } = validation.data;

    // Verify payer is a member of the group
    const payerMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: payerUserId
        }
      }
    });

    // Verify receiver is a member of the group
    const receiverMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: receiverUserId
        }
      }
    });

    if (!payerMembership || !receiverMembership) {
      return NextResponse.json({ error: "Payer or receiver is not a member of this group." }, { status: 400 });
    }

    // Verify caller belongs to the group
    const callerMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: currentUser.id
        }
      }
    });

    if (!callerMembership) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this group." }, { status: 403 });
    }

    // Record the settlement
    const settlement = await prisma.settlement.create({
      data: {
        groupId,
        payerUserId,
        receiverUserId,
        amount,
        note,
        createdByUserId: currentUser.id
      },
      include: {
        payerUser: { select: { id: true, fullName: true, avatarUrl: true } },
        receiverUser: { select: { id: true, fullName: true, avatarUrl: true } }
      }
    });

    // Notify group of balance update
    await triggerRealtimeEvent(`group-${groupId}`, "settlement-changed", {
      action: "create",
      settlementId: settlement.id
    });

    return NextResponse.json({ settlement }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating settlement:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
