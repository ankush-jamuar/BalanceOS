import PusherServer from "pusher";

let pusherServerInstance: PusherServer | null = null;

/**
 * Initializes and returns a singleton instance of the Pusher server client.
 * Returns null and prints a warning if credentials are not configured yet.
 */
export function getPusherServer() {
  if (pusherServerInstance) return pusherServerInstance;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    console.warn("Pusher environment keys are missing. Realtime sync is disabled.");
    return null;
  }

  pusherServerInstance = new PusherServer({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return pusherServerInstance;
}

/**
 * Utility function to emit realtime socket notifications.
 */
export async function triggerRealtimeEvent(channel: string, event: string, data: unknown) {
  try {
    const server = getPusherServer();
    if (server) {
      await server.trigger(channel, event, data as Parameters<PusherServer["trigger"]>[2]);
    }
  } catch (error) {
    console.error(`Pusher notification failed on channel ${channel}:`, error);
  }
}
