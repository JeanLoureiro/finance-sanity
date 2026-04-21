import { DashboardShell } from "@/components/DashboardShell";
import { getAuthUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: { user } } = await getAuthUser();
  return <DashboardShell email={user?.email ?? null}>{children}</DashboardShell>;
}
