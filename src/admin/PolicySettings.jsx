import Field from "../components/Field";
export default function PolicySettings({ policies, onChange }) {
  return (
    <div className="grid gap-5">
      <p className="text-sm text-stone-600">
        Review the policies before replacing draft notes. Changes are public; do
        not enter private information or credentials.
      </p>
      {Object.entries(policies).map(([key, p]) => {
        const update = (patch) =>
          onChange({ ...policies, [key]: { ...p, ...patch } });
        return (
          <fieldset
            key={key}
            className="border rounded-xl p-4 grid gap-3 min-w-0"
          >
            <legend className="font-bold">
              {key === "privacy" ? "Privacy Policy" : "Orders & Returns"}
            </legend>
            <Field label={`${key} page title`}>
              <input
                className="in"
                maxLength={150}
                value={p.title}
                onChange={(e) => update({ title: e.target.value })}
              />
            </Field>
            <Field label={`${key} introduction / review note`}>
              <textarea
                className="in"
                rows={3}
                maxLength={5000}
                value={p.intro}
                onChange={(e) => update({ intro: e.target.value })}
              />
            </Field>
            {p.sections.map(([heading, body], i) => (
              <div key={i} className="grid gap-2 border-t pt-3">
                <Field label={`${key} section ${i + 1} heading`}>
                  <input
                    className="in"
                    maxLength={150}
                    value={heading}
                    onChange={(e) =>
                      update({
                        sections: p.sections.map((s, n) =>
                          n === i ? [e.target.value, s[1]] : s,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label={`${key} section ${i + 1} text`}>
                  <textarea
                    className="in"
                    rows={5}
                    maxLength={10000}
                    value={body}
                    onChange={(e) =>
                      update({
                        sections: p.sections.map((s, n) =>
                          n === i ? [s[0], e.target.value] : s,
                        ),
                      })
                    }
                  />
                </Field>
              </div>
            ))}
          </fieldset>
        );
      })}
    </div>
  );
}
