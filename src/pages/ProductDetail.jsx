import { useState } from "react";
import { html } from "../lib/html";
import { P } from "../lib/format";
import { I, Pic, Modal } from "../components/prototype";
export const Detail = ({ p, add, onClose }) => {
  const [n, setN] = useState(1);
  return html`<${Modal} title=${p.name} onClose=${onClose}
    ><div className="grid md:grid-cols-2 gap-5">
      <div className="rounded-xl overflow-hidden">
        <${Pic} p=${p} big=${true} />
      </div>
      <div>
        <span className="text-sm font-semibold text-[#8a5a00]">${p.cat}</span>
        <p className="text-3xl font-extrabold mt-1">${P(p.price)}</p>
        <p
          className=${"font-semibold " + (p.stock ? "text-emerald-700" : "text-red-700")}
        >
          ${p.stock ? p.stock + " available" : "Out of stock"}
        </p>
        <p className="mt-3 text-slate-700">${p.desc}</p>
        <h3 className="font-bold mt-4">Specifications</h3>
        <ul className="list-disc pl-5 text-slate-700">
          ${p.specs.split(" · ").map((s) => html`<li key=${s}>${s}</li>`)}
        </ul>
        ${
          p.stock > 0 &&
          html`<div className="flex items-center gap-3 mt-5">
            <div className="flex items-center border rounded-xl">
              <button
                className="p-3"
                aria-label="Decrease quantity"
                onClick=${() => setN(Math.max(1, n - 1))}
              >
                <${I} n="minus" s=${16} /></button
              ><span className="w-8 text-center font-bold" aria-live="polite"
                >${n}</span
              ><button
                className="p-3"
                aria-label="Increase quantity"
                onClick=${() => setN(Math.min(p.stock, n + 1))}
              >
                <${I} n="plus" s=${16} />
              </button>
            </div>
            <button
              className="btn bp flex-1"
              onClick=${() => {
                add(p, n);
                onClose();
              }}
            >
              Add to Cart
            </button>
          </div>`
        }
      </div>
    </div><//
  >`;
};
