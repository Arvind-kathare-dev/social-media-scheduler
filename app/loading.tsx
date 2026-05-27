"use client";

import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[var(--bg)] text-[var(--text)]">
      <Loader2 className="h-12 w-12 animate-spin text-[var(--primary)] mb-6 drop-shadow-md" />
      <h2 className="text-2xl font-extrabold tracking-tight">Loading...</h2>
      <p className="text-sm text-[var(--muted)] mt-2 font-medium">Please wait while the page is preparing.</p>
    </div>
  );
}
