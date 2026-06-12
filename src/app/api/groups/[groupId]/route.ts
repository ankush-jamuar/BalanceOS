import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSyncedUser } from "@/lib/user-sync";
import { updateGroupSchema } from "@/lib/validations";

type ParamsInput = { params: Promise<{ groupId: string }> };

/**
 * GET: Fetch group details.
 */
export async function GET(req: Request, { params }: ParamsInput) {
  try {
    const currentUser = await getOrCreateSyncedUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;

    // Check if the user is a member of the group
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

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            avatarUrl: true
          }
        },
        members: {
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
        }
      }
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    return NextResponse.json({ group }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching group details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PATCH: Update group details.
 */
export async function PATCH(req: Request, { params }: ParamsInput) {
  try {
    const currentUser = await getOrCreateSyncedUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;

    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    // Only OWNER can update the group details
    if (group.ownerId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden: Only the owner can edit group details." }, { status: 403 });
    }

    const body = await req.json();
    const validation = updateGroupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { name, description } = validation.data;

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        name,
        description
      }
    });

    return NextResponse.json({ group: updatedGroup }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error updating group:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE: Delete a group.
 */
export async function DELETE(req: Request, { params }: ParamsInput) {
  try {
    const currentUser = await getOrCreateSyncedUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;

    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    // Only OWNER can delete the group
    if (group.ownerId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden: Only the owner can delete the group." }, { status: 403 });
    }

    await prisma.group.delete({
      where: { id: groupId }
    });

    return NextResponse.json({ message: "Group deleted successfully." }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error deleting group:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
