export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-black px-6 font-sans">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00f3ff]/10 blur-3xl"
      />

      <main className="relative flex flex-col items-center gap-8 text-center">
        {/* Brand mark */}
        <span className="rounded-full border border-[#00f3ff]/40 bg-[#00f3ff]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-[#00f3ff]">
          SmarTok
        </span>

        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
          SmarTok Store
        </h1>

        <p className="text-lg font-medium text-[#00f3ff] sm:text-xl">
          Coming Soon
        </p>

        <p className="max-w-md text-sm leading-6 text-zinc-400 sm:text-base">
          Exclusive merch and limited drops are on the way. Stay tuned.
        </p>

        {/* Divider accent */}
        <div className="h-px w-40 bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent" />
      </main>
    </div>
  );
}
