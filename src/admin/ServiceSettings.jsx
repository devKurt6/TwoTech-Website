import Field from "../components/Field";
import { SVC } from "../data/services";
export default function ServiceSettings({ services, onChange, errors }) {
  const update = (id, patch) =>
    onChange(services.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  return (
    <div className="grid gap-5">
      <p className="text-sm text-stone-600">
        All prices are starting estimates. Leave individual prices blank to show
        the inclusion without a price. Custom Development remains quote-based.
        Hide unavailable groups instead of deleting their history.
      </p>
      {services.map((s) => {
        const booking = SVC.find((g) => g.id === s.id).mode === "book";
        const item = (index, patch) =>
          update(s.id, {
            items: s.items.map((v, i) =>
              i === index ? { ...v, ...patch } : v,
            ),
          });
        return (
          <fieldset
            className="border rounded-xl p-4 grid gap-3 min-w-0"
            key={s.id}
          >
            <legend className="font-extrabold px-1">{s.title || s.id}</legend>
            <label className="flex items-center gap-2 min-h-11">
              <input
                type="checkbox"
                checked={s.visible}
                onChange={(e) => update(s.id, { visible: e.target.checked })}
              />
              Show this group on the website
            </label>
            <Field label={`Title (${s.id})`}>
              <input
                className="in"
                value={s.title}
                maxLength={150}
                onChange={(e) => update(s.id, { title: e.target.value })}
              />
            </Field>
            <Field label={`Description (${s.id})`}>
              <textarea
                className="in"
                value={s.description}
                maxLength={5000}
                rows={3}
                onChange={(e) => update(s.id, { description: e.target.value })}
              />
            </Field>
            {booking && (
              <>
                <Field label={`Starting price (${s.id}) — ₱`}>
                  <input
                    className="in"
                    type="number"
                    min="0"
                    max="999999"
                    step="0.01"
                    value={s.starting_price ?? ""}
                    onChange={(e) =>
                      update(s.id, {
                        starting_price:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label={`Price label (${s.id})`}>
                  <input
                    className="in"
                    value={s.price_label}
                    maxLength={50}
                    onChange={(e) =>
                      update(s.id, { price_label: e.target.value })
                    }
                  />
                </Field>
                <fieldset>
                  <legend className="text-sm font-bold">
                    Available service modes
                  </legend>
                  <div className="flex flex-wrap gap-3">
                    {["Drop-off", "Onsite", "Remote"].map((m) => (
                      <label
                        key={m}
                        className="flex gap-2 items-center min-h-11"
                      >
                        <input
                          type="checkbox"
                          checked={s.modes.includes(m)}
                          onChange={(e) =>
                            update(s.id, {
                              modes: e.target.checked
                                ? [...s.modes, m]
                                : s.modes.filter((v) => v !== m),
                            })
                          }
                        />
                        {m}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </>
            )}
            <p className="font-bold text-sm">
              Inclusions {booking && "and optional starting prices"}
            </p>
            {s.items.map((v, index) => (
              <div className="grid gap-2 border-t pt-3" key={index}>
                <Field label={`Inclusion ${index + 1} (${s.id})`}>
                  <input
                    className="in"
                    value={v.name}
                    maxLength={200}
                    onChange={(e) => item(index, { name: e.target.value })}
                  />
                </Field>
                {booking && (
                  <Field
                    label={`Inclusion ${index + 1} price (${s.id}) — ₱ (optional)`}
                  >
                    <input
                      className="in"
                      type="number"
                      min="0"
                      max="999999"
                      step="0.01"
                      value={v.price ?? ""}
                      onChange={(e) =>
                        item(index, {
                          price:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      }
                    />
                  </Field>
                )}
                <button
                  type="button"
                  className="btn bs justify-self-start"
                  disabled={s.items.length === 1}
                  onClick={() =>
                    update(s.id, {
                      items: s.items.filter((_, i) => i !== index),
                    })
                  }
                >
                  Remove inclusion {index + 1}
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn bs justify-self-start"
              disabled={s.items.length >= 40}
              onClick={() =>
                update(s.id, { items: [...s.items, { name: "", price: null }] })
              }
            >
              Add inclusion ({s.id})
            </button>
            {errors[s.id] && (
              <p role="alert" className="text-red-700 text-sm">
                {errors[s.id]}
              </p>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
