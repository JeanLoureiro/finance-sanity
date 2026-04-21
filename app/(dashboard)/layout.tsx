import { DashboardShell } from "@/components/DashboardShell";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  // getSession() reads from the cookie — no network call.
  // The proxy middleware already called getUser() to verify the token,
  // so the cookie is guaranteed to hold a fresh, verified session here.
  const { data: { session } } = await supabase.auth.getSession();
  return <DashboardShell email={session?.user?.email ?? null}>{children}</DashboardShell>;
}
