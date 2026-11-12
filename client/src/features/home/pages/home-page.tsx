import { useCurrentUser } from "@/features/auth/hooks/use-auth";

// Placeholder until the net worth screens are built.
export function HomePage() {
  const { data: user } = useCurrentUser();

  return (
    <div className="flex flex-col gap-2 py-10 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Hi{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
      </h1>
      <p className="text-sm text-muted-foreground">
        Net worth tracking is coming soon.
      </p>
    </div>
  );
}
