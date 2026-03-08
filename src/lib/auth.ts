import { prisma } from "@/lib/db";

const LOCAL_USER_EMAIL = "local@golfpulse.local";

/**
 * Single-user local mode — returns a default user ID,
 * auto-creating the user on first run.
 */
let cachedUserId: string | null = null;

export async function requireUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;

  let user = await prisma.user.findUnique({
    where: { email: LOCAL_USER_EMAIL },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: LOCAL_USER_EMAIL,
        name: "Local User",
      },
    });
  }

  cachedUserId = user.id;
  return cachedUserId;
}
