import { auth, currentUser } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { StudioClient } from "./StudioClient";

export default async function StudioPage() {
  const { userId } = await auth();
  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Sign in to open the studio.
      </div>
    );
  }

  const user = await currentUser();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
          Loading studio…
        </div>
      }
    >
      <StudioClient
        userId={userId}
        userFirstName={user?.firstName ?? null}
      />
    </Suspense>
  );
}
