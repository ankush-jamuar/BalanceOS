import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSyncedUser } from "@/lib/user-sync";
import { createGroupSchema } from "@/lib/validations";

/**
 * GET: List all groups the user is a member of.
 */
export async function GET() {
  try {
    const currentUser = await getOrCreateSyncedUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve groups where user is a registered member
    const memberships = await prisma.groupMember.findMany({
      where: { userId: currentUser.id },
      include: {
        group: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true
              }
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const groups = memberships.map(m => m.group);

    return NextResponse.json({ groups }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error listing groups:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST: Create a new group.
 */
export async function POST(req: Request) {
  try {
    const currentUser = await getOrCreateSyncedUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = createGroupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { name, description, currency } = validation.data;

    // Create group and add the creator as OWNER (run automatically as transaction)
    const group = await prisma.group.create({
      data: {
        name,
        description,
        currency,
        ownerId: currentUser.id,
        members: {
          create: {
            userId: currentUser.id,
            role: "OWNER"
          }
        }
      },
      include: {
        members: true
      }
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating group:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
