import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const grant = await prisma.sharedAccess.findUnique({
      where: { token },
      select: { id: true, granteeEmail: true, status: true },
    });

    if (!grant || grant.status !== "PENDING") {
      return Response.json(
        { error: "Invite not found or already used" },
        { status: 404 }
      );
    }

    if (grant.granteeEmail.toLowerCase() !== user.email?.toLowerCase()) {
      return Response.json(
        { error: "This invite was sent to a different email address" },
        { status: 403 }
      );
    }

    await prisma.sharedAccess.update({
      where: { id: grant.id },
      data: { status: "ACCEPTED", granteeUserId: user.id },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/net-worth`);
  } catch {
    return Response.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
