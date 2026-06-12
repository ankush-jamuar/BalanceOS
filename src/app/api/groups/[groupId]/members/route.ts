import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getOrCreateSyncedUser } from "@/lib/user-sync";
import { addMemberSchema } from "@/lib/validations";

type ParamsInput = { params: Promise<{ groupId: string }> };

/**
 * POST: Add a user as a member to a group.
 */
export async function POST(req: Request, { params }: ParamsInput) {
  try {
    const currentUser = await getOrCreateSyncedUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;

    // Check if the group exists and if the currentUser is the OWNER
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    if (group.ownerId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden: Only the owner can add members to the group." }, { status: 403 });
    }

    const body = await req.json();
    const validation = addMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { email, username } = validation.data;

    const orConditions: Prisma.UserWhereInput[] = [];
    if (email) orConditions.push({ email });
    if (username) orConditions.push({ username });

    // Find the target user in the local database
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: orConditions
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found. Only registered users can be added." }, { status: 404 });
    }

    // Check if the user is already a member
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: targetUser.id
        }
      }
    });

    if (existingMembership) {
      return NextResponse.json({ error: "User is already a member of this group." }, { status: 400 });
    }

    // Add member to group
    const newMember = await prisma.groupMember.create({
      data: {
        groupId,
        userId: targetUser.id,
        role: "MEMBER"
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

    return NextResponse.json({ member: newMember }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error adding group member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
