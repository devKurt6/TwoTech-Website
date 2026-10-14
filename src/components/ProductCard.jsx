import { html } from "../lib/html";
import { P } from "../lib/format";
import { Pic } from "./prototype";
export const PCard = ({ p, add, view, threshold = 5 }) =>
  html`<article className="card h overflow-hidden flex flex-col">
    <button onClick=${() => view(p)} aria-label=${"View " + p.name}>
      <${Pic} p=${p} />
    </button>
    <div className="p-4 flex flex-col flex-1">
      <span className="text-xs font-semibold text-[#8a5a00]">${p.cat}</span
      ><button
        className="text-left font-bold mt-1 hover:text-[#8a5a00]"
        onClick=${() => view(p)}
      >
        ${p.name}
      </button>
      <div className="mt-auto pt-3">
        <p className="text-xl font-extrabold">${P(p.price)}</p>
        <p
          className=${"text-sm font-semibold " + (p.stock > 0 ? (p.stock <= threshold ? "text-amber-700" : "text-emerald-700") : "text-red-700")}
        >
          ${p.stock > 0 ? (p.stock <= threshold ? "Only " + p.stock + " left" : "In stock") : "Out of stock"}
        </p>
        <button
          disabled=${!p.stock}
          onClick=${() => add(p, 1)}
          className=${"btn w-full mt-3 " + (p.stock ? "bp" : "bs opacity-60 cursor-not-allowed")}
        >
          ${p.stock ? "Add to Cart" : "Unavailable"}
        </button>
      </div>
    </div>
  </article>`;
