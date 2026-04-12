import { headers } from "next/headers";
import AcceptInviteClient from "./AcceptInviteClient";

type InviteMetadata = {
  granteeEmail: string;
  ownerEmail: string;
  role: "READ" | "WRITE";
};

async function fetchInviteMetadata(
  token: string,
  origin: string
): Promise<InviteMetadata | null> {
  try {
    const response = await fetch(`${origin}/api/invitations/${token}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Invalid invite link.</p>
      </div>
    );
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const invite = await fetchInviteMetadata(token, origin);

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">
          This invite link is invalid or has already been used.
        </p>
      </div>
    );
  }

  return <AcceptInviteClient token={token} invite={invite} />;
}
