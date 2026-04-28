import { prisma } from "@/lib/prisma";
import { getAuthUser, withAuth } from "@/lib/auth";

export const GET = withAuth(async () => {
  const { data: { user } } = await getAuthUser();

  if (!user?.email) {
    return Response.json([]);
  }

  const pending = await prisma.sharedAccess.findMany({
    where: {
      granteeEmail: { equals: user.email, mode: "insensitive" },
      status: "PENDING",
    },
    select: {
      token: true,
      ownerEmail: true,
      role: true,
      granteeEmail: true,
    },
  });

  return Response.json(pending);
});
