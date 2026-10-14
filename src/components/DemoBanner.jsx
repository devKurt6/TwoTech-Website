import { useState } from "react";
import { DEMO_ENABLED, demoCopy } from "../data/demoCopy";
export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (!DEMO_ENABLED || dismissed) return null;
  return (
    <aside
      aria-label="Portfolio notice"
      className="bg-gold text-ink px-4 py-1 flex items-center justify-center gap-3 text-sm"
    >
      <span>{demoCopy.banner}</span>
      <button
        aria-label={demoCopy.dismiss}
        className="min-w-11 min-h-11 rounded-lg hover:bg-black/10"
        onClick={() => setDismissed(true)}
      >
        ✕
      </button>
    </aside>
  );
}
