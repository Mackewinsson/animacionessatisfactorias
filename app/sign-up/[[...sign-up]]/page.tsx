import { SignUp } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerkAppearance";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <SignUp
        appearance={clerkAppearance}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
      />
    </main>
  );
}
