import { useLocation, useNavigate } from "react-router-dom";
import { Wrench, Code2, Check } from "lucide-react";
import { SVC } from "../data/services";
import { I } from "../components/prototype";
function ServiceCard({ service: s, book }) {
  return (
    <section className="card p-5 flex flex-col text-ink">
      <div className="flex gap-3 items-center">
        <span className="w-12 h-12 rounded-xl bg-amber-50 text-goldText grid place-items-center shrink-0">
          <I n={s.ic} s={24} />
        </span>
        <div>
          <h3 className="font-extrabold text-lg leading-tight">{s.t}</h3>
          <p className="text-sm font-bold text-goldText">{s.from}</p>
        </div>
      </div>
      <p className="text-stone-600 mt-3 text-sm">{s.d}</p>
      <h4 className="font-bold text-sm mt-3">Includes</h4>
      <ul className="mt-1 grid gap-1 text-sm">
        {s.items.map((i) => (
          <li key={i} className="flex gap-2">
            <Check size={16} className="text-emerald-700 mt-0.5 shrink-0" />
            {i}
          </li>
        ))}
      </ul>
      {s.mode === "book" && (
        <div className="mt-auto pt-4">
          <button
            className="btn bp w-full sm:w-auto"
            onClick={() => book(s.id)}
          >
            Book a Service
          </button>
        </div>
      )}
    </section>
  );
}
export const Services = ({ go, book }) => {
  const location = useLocation(),
    navigate = useNavigate();
  const development = location.pathname === "/services/development";
  const tabs = [
    {
      id: "repair",
      label: "Repair & IT Support",
      path: "/services",
      icon: Wrench,
    },
    {
      id: "development",
      label: "Custom Development",
      path: "/services/development",
      icon: Code2,
    },
  ];
  function key(e, index) {
    let next;
    if (e.key === "ArrowRight") next = (index + 1) % 2;
    else if (e.key === "ArrowLeft") next = (index + 1) % 2;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 1;
    else return;
    e.preventDefault();
    e.currentTarget.parentElement
      .querySelectorAll('[role="tab"]')
      [next].focus();
    navigate(tabs[next].path);
  }
  return (
    <div className="max-w-6xl mx-auto px-4 pt-10">
      <h1 className="text-3xl sm:text-4xl font-extrabold">Services</h1>
      <p className="mt-2 text-stone-600">
        Repairs, upgrades, maintenance, and custom development.
      </p>
      <div
        role="tablist"
        aria-label="Service categories"
        className="mt-6 grid grid-cols-2 sm:inline-flex gap-1 p-1 bg-stone-200 rounded-2xl w-full sm:w-auto"
      >
        {tabs.map((t, index) => {
          const active = development === Boolean(index),
            Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={"tab-" + t.id}
              aria-controls={"panel-" + t.id}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => navigate(t.path)}
              onKeyDown={(e) => key(e, index)}
              className={
                "btn px-3 text-sm " +
                (active ? "bp" : "text-stone-700 hover:bg-white/70")
              }
            >
              <Icon size={18} className="shrink-0" />
              {t.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id="panel-repair"
        aria-labelledby="tab-repair"
        tabIndex={0}
        hidden={development}
        className="mt-6"
      >
        {!development && (
          <>
            <h2 className="sr-only">Repair & IT Support services</h2>
            <p className="bg-amber-50 border border-amber-200 text-goldText text-sm p-4 rounded-xl">
              Starting prices shown with * are estimates. Final repair pricing
              depends on inspection, device condition, parts, and agreed scope.
            </p>
            <div className="grid md:grid-cols-2 gap-5 mt-5">
              {SVC.filter((s) => s.mode === "book").map((s) => (
                <ServiceCard key={s.id} service={s} book={book} />
              ))}
            </div>
            <aside className="card p-5 mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="font-bold">
                Need software, automation, or an embedded project?
              </p>
              <button
                className="btn bs"
                onClick={() => navigate("/services/development")}
              >
                Explore Custom Development
              </button>
            </aside>
          </>
        )}
      </div>
      <div
        role="tabpanel"
        id="panel-development"
        aria-labelledby="tab-development"
        tabIndex={0}
        hidden={!development}
        className="mt-6"
      >
        {development && (
          <section className="hero text-white rounded-3xl p-5 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Custom Development
            </h2>
            <p className="mt-3 max-w-3xl text-stone-200">
              Software, automation, and embedded systems are quoted per project.
              We review your requirements first, then send a quotation based on
              the agreed scope.
            </p>
            <div className="grid lg:grid-cols-3 gap-5 mt-6">
              {SVC.filter((s) => s.mode === "quote").map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              <button className="btn bp" onClick={() => go("Custom Projects")}>
                Request a Quote
              </button>
              <button className="btn bd" onClick={() => navigate("/services")}>
                See repair services
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
