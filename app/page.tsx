import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { AuthNav } from "@/components/AuthNav";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="text-sm font-medium text-violet-400">
            Satisfying ball videos
          </span>
          <AuthNav />
        </div>
      </header>

      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-violet-400">
          Satisfying ball videos
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Custom bouncing-ball animations
        </h1>
        <p className="mt-6 text-lg text-zinc-400">
          Pick your colors, watermark, and length. Preview in the browser after
          signing in. Pay once to download a transparent export ready for social.
        </p>
        <p className="mt-4 text-2xl font-semibold text-white">
          $4.99{" "}
          <span className="text-base font-normal text-zinc-500">per export</span>
        </p>

        <Show when="signed-in">
          <Link
            href="/studio"
            className="mt-10 inline-block rounded-xl bg-violet-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-violet-900/40 hover:bg-violet-500"
          >
            Open studio
          </Link>
        </Show>

        <Show when="signed-out">
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-block rounded-xl bg-violet-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-violet-900/40 hover:bg-violet-500"
            >
              Get started free
            </Link>
            <Link
              href="/sign-in"
              className="inline-block rounded-xl border border-zinc-700 px-8 py-4 text-lg font-semibold text-zinc-200 hover:bg-zinc-900"
            >
              Sign in
            </Link>
          </div>
        </Show>

        <ul className="mt-16 grid w-full gap-4 text-left text-sm text-zinc-400 sm:grid-cols-3">
          <li className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <strong className="text-white">Customize</strong>
            <br />
            Watermark, hue, 30s or 60s
          </li>
          <li className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <strong className="text-white">Preview</strong>
            <br />
            Live canvas in your studio
          </li>
          <li className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <strong className="text-white">Download</strong>
            <br />
            MP4, GIF, WebM, or PNG after unlock
          </li>
        </ul>
      </div>
    </main>
  );
}
