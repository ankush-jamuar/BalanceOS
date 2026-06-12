import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    return new Response("Error: CLERK_WEBHOOK_SECRET is missing from environment variables.", {
      status: 500,
    });
  }

  // Create a new Svix instance with our signing secret
  const wh = new Webhook(SIGNING_SECRET);

  // Retrieve verification headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // Error out if any headers are missing
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix signature headers.", {
      status: 400,
    });
  }

  // Get raw request payload
  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  // Verify the payload using Svix verify checks
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Webhook signature verification failed:", err);
    return new Response("Error: Webhook signature verification failed.", {
      status: 400,
    });
  }

  const { id } = evt.data;
  if (!id) {
    return new Response("Error: Webhook payload missing user ID.", { status: 400 });
  }
  const eventType = evt.type;

  // Handle user creation & user updates
  if (eventType === "user.created" || eventType === "user.updated") {
    const { email_addresses, username, first_name, last_name, image_url } = evt.data;
    const email = email_addresses?.[0]?.email_address;

    if (!email) {
      return new Response("Error: User email is missing.", { status: 400 });
    }

    const resolvedUsername = username || email.split("@")[0] || `user_${id?.substring(0, 8)}`;
    const fullName = `${first_name || ""} ${last_name || ""}`.trim() || resolvedUsername;
    const avatarUrl = image_url || "";

    await prisma.user.upsert({
      where: { clerkId: id },
      update: {
        email,
        username: resolvedUsername,
        fullName,
        avatarUrl,
      },
      create: {
        clerkId: id,
        email,
        username: resolvedUsername,
        fullName,
        avatarUrl,
      },
    });
  }

  // Handle user deletion
  if (eventType === "user.deleted") {
    await prisma.user.deleteMany({
      where: { clerkId: id },
    });
  }

  return new Response("Webhook processed successfully.", { status: 200 });
}
