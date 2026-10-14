import { policies } from "../data/policies";
import { useSettings } from "../hooks/useSettings";
export default function Policy({ type }) {
  const policy = policies[type],
    { data: s } = useSettings();
  return (
    <article className="max-w-3xl mx-auto px-4 pt-10">
      <h1 className="text-3xl sm:text-4xl font-extrabold">{policy.title}</h1>
      <p className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-goldText text-sm">
        {policy.intro}
      </p>
      <div className="card p-5 sm:p-8 mt-6 grid gap-6">
        {policy.sections.map(([heading, body]) => (
          <section key={heading}>
            <h2 className="text-lg font-extrabold">{heading}</h2>
            <p className="mt-2 text-stone-700">{body}</p>
          </section>
        ))}
        <section>
          <h2 className="text-lg font-extrabold">Contact Two Tech</h2>
          <p className="mt-2">{s.address}</p>
          <a
            className="block min-h-11 py-2 underline text-goldText"
            href={"mailto:" + s.email}
          >
            {s.email}
          </a>
          <a
            className="block min-h-11 py-2 underline text-goldText"
            href={"tel:" + s.phone.replace(/\s/g, "")}
          >
            {s.phone}
          </a>
        </section>
      </div>
    </article>
  );
}
