import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerkAppearance";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <SignIn
        appearance={clerkAppearance}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
      />
    </main>
  );
}
