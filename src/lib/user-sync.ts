import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./db";

/**
 * Validates whether the authenticated user exists in the local database.
 * If the user record is missing (e.g. Clerk webhook delay), it creates it on the fly.
 */
export async function getOrCreateSyncedUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  // Check if the user already exists in the database
  let dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (!dbUser) {
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      throw new Error("User email not found in Clerk session.");
    }

    const username = clerkUser.username || email.split("@")[0] || `user_${Math.random().toString(36).substring(2, 8)}`;
    const fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || username;
    const avatarUrl = clerkUser.imageUrl || "";

    // Insert user into our Postgres database
    dbUser = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email,
        username,
        fullName,
        avatarUrl,
      },
    });
  }

  return dbUser;
}
