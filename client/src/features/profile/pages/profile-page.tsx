import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { useCurrentUser, useLogout } from "@/features/auth/hooks/use-auth";
import { initialOf } from "@/layouts/nav-items";

export function ProfilePage() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <>
      <PageHeader title="Profile" />
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
          {initialOf(user?.fullName)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{user?.fullName}</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>
      <Button variant="outline" className="mt-6 w-full gap-2 md:w-auto" onClick={logout}>
        <LogOut className="size-4" /> Log out
      </Button>
    </>
  );
}
