import { useState, useMemo } from "react";
import { html } from "../lib/html";
import { P } from "../lib/format";
import { CATS, PRODUCTS } from "../data/products";
import { I, Field, Head } from "../components/prototype";
import { PCard } from "../components/ProductCard";
export const Shop = ({ add, view, products = PRODUCTS, settings }) => {
  const [q, setQ] = useState("");
  const [c, setC] = useState("All");
  const [max, setMax] = useState(20000);
  const [sort, setSort] = useState("feat");
  const list = useMemo(() => {
    let r = products.filter(
      (p) =>
        (c === "All" || p.cat === c) &&
        p.price <= max &&
        p.name.toLowerCase().includes(q.toLowerCase()),
    );
    if (sort === "lo") r = [...r].sort((a, b) => a.price - b.price);
    if (sort === "hi") r = [...r].sort((a, b) => b.price - a.price);
    return r;
  }, [q, c, max, sort, products]);
  return html`<div className="max-w-6xl mx-auto px-4 pt-10">
    <${Head}
      t="Shop computer parts"
      s="Browse computer parts and accessories."
    />
    <div className="card p-4 mt-5 grid gap-3 md:grid-cols-4">
      <${Field} l="Search"
        ><div className="relative mt-1">
          <input
            className="in pl-9"
            type="search"
            value=${q}
            onInput=${(e) => setQ(e.target.value)}
            placeholder="e.g. SSD"
          /><span className="absolute left-3 top-3 text-slate-500"
            ><${I} n="search" s=${18}
          /></span></div><//
      ><${Field} l="Category"
        ><select
          className="in mt-1"
          value=${c}
          onChange=${(e) => setC(e.target.value)}
        >
          <option>All</option>
          ${CATS.map((x) => html`<option key=${x}>${x}</option>`)}
        </select><//
      ><${Field} l=${"Max price: " + P(max)}
        ><input
          className="w-full mt-3"
          type="range"
          min="500"
          max="20000"
          step="500"
          value=${max}
          onInput=${(e) => setMax(+e.target.value)} /><//
      ><${Field} l="Sort by"
        ><select
          className="in mt-1"
          value=${sort}
          onChange=${(e) => setSort(e.target.value)}
        >
          <option value="feat">Featured</option>
          <option value="lo">Price: low to high</option>
          <option value="hi">Price: high to low</option>
        </select><//
      >
    </div>
    <p className="mt-4 text-sm text-slate-600" aria-live="polite">
      ${list.length} product${list.length === 1 ? "" : "s"}
    </p>
    ${
      list.length
        ? html`<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
            ${list.map((p) => html`<${PCard} key=${p.id} p=${p} add=${add} view=${view} threshold=${settings.low_stock_threshold} />`)}
          </div>`
        : html`<div className="card p-10 text-center mt-3">
            <b>No products match your filters.</b>
            <p className="text-slate-600 mt-1">
              Try a different search or raise the price limit.
            </p>
            <button
              className="btn bp mt-4"
              onClick=${() => {
                setQ("");
                setC("All");
                setMax(20000);
              }}
            >
              Clear filters
            </button>
          </div>`
    }
  </div>`;
};
