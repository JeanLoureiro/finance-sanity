import { prisma } from "@/lib/prisma";

/**
 * Gets or creates the UserSettings row for the given Supabase user ID.
 * On first login after the multi-user migration is deployed, claims the
 * existing unlinked row rather than creating a fresh one.
 * Always keeps ownerEmail in sync so the cron job can reliably email the owner.
 */
export async function getOrCreateSettingsForUser(userId: string, email: string) {
  const linked = await prisma.userSettings.findUnique({ where: { userId } });
  if (linked) {
    if (linked.ownerEmail !== email) {
      return prisma.userSettings.update({
        where: { id: linked.id },
        data: { ownerEmail: email },
      });
    }
    return linked;
  }

  // Migration path: claim the unlinked legacy row if exactly one exists.
  const unlinked = await prisma.userSettings.findFirst({
    where: { userId: null },
  });
  if (unlinked) {
    return prisma.userSettings.update({
      where: { id: unlinked.id },
      data: { userId, ownerEmail: email, role: "OWNER" },
    });
  }

  await prisma.userSettings.create({
    data: {
      userId,
      ownerEmail: email,
      salary: 0,
      netIncome: 0,
      role: "OWNER",
    },
  });
}
