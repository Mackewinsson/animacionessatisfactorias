"use client";

import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerkAppearance";

type AuthNavProps = {
  signInMode?: "modal" | "redirect";
  signUpMode?: "modal" | "redirect";
};

export function AuthNav({
  signInMode = "redirect",
  signUpMode = "redirect",
}: AuthNavProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Show when="signed-out">
        <SignInButton mode={signInMode} appearance={clerkAppearance}>
          <button
            type="button"
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
          >
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode={signUpMode} appearance={clerkAppearance}>
          <button
            type="button"
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Sign up
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton appearance={clerkAppearance} />
      </Show>
    </div>
  );
}
