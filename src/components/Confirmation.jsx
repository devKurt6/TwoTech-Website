import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { DEMO_ENABLED, demoCopy } from "../data/demoCopy";
export default function Confirmation({ title, reference, children, onReset }) {
  return (
    <section
      role="status"
      aria-live="polite"
      className="card p-6 sm:p-8 text-center max-w-xl mx-auto"
    >
      <Check className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 p-3 mb-3" />
      <h1 className="text-2xl font-extrabold">{title}</h1>
      {DEMO_ENABLED && (
        <p className="mt-2 text-sm font-bold text-goldText bg-amber-50 rounded-lg p-2">
          {demoCopy.confirmation}
        </p>
      )}
      <p className="mt-4 text-stone-600">Reference</p>
      <p className="text-xl font-extrabold text-goldText break-all">
        {reference}
      </p>
      <div className="mt-3 text-left text-stone-700 space-y-2">{children}</div>
      <div className="mt-5 flex gap-2 justify-center flex-wrap">
        {onReset && (
          <button className="btn bs" onClick={onReset}>
            Submit another
          </button>
        )}
        <Link className="btn bp" to="/">
          Back to home
        </Link>
      </div>
    </section>
  );
}
