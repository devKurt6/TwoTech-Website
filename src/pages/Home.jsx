import { demo } from "../lib/api";
import { useState, useEffect, useMemo } from "react";
import { html } from "../lib/html";
import { P } from "../lib/format";
import { CATS, PRODUCTS } from "../data/products";
import { SVC, BOOKABLE } from "../data/services";
import { I, Demo, Pic, Field, Modal, Head } from "../components/prototype";
import { PCard } from "../components/ProductCard";
export const Home = ({ go, add, view, products = PRODUCTS, settings }) =>
  html`<div>
    <section className="hero text-white">
      <div
        className="max-w-6xl mx-auto px-4 py-16 sm:py-24 grid lg:grid-cols-5 gap-10 items-center"
      >
        <div className="lg:col-span-3">
          <h1
            className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight"
          >
            ${settings.headline}
          </h1>
          <p className="mt-5 text-stone-300 text-lg max-w-xl">
            From choosing the right computer parts to fixing a PC that won't
            boot, to building software and embedded devices for your business —
            one local team, clear quotations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="btn bp" onClick=${() => go("Services")}>
              Explore Services</button
            ><button className="btn bd" onClick=${() => go("Shop")}>
              Shop Computer Parts
            </button>
          </div>
        </div>
        <div className="lg:col-span-2 grid gap-3">
          ${[
            [
              "Buy parts",
              "Shop",
              "cart",
              "Processors, RAM, storage, GPUs and more.",
            ],
            [
              "Book a repair",
              "Services",
              "wrench",
              "Diagnosis, cleaning, formatting, upgrades.",
            ],
            [
              "Request a quote",
              "Custom Projects",
              "code",
              "Software, automation, embedded systems.",
            ],
          ].map(
            (a) =>
              html`<button
                key=${a[0]}
                onClick=${() => go(a[1])}
                className="text-left flex gap-3 items-center rounded-2xl bg-white/10 border border-white/20 p-4 hover:bg-white/20 transition"
              >
                <span
                  className="w-11 h-11 rounded-xl bg-[#F7B52C] text-black grid place-items-center shrink-0"
                  ><${I} n=${a[2]} /></span
                ><span
                  ><b className="block">${a[0]}</b
                  ><span className="text-sm text-stone-300">${a[3]}</span></span
                >
              </button>`,
          )}
        </div>
      </div>
    </section>
    <section className="max-w-6xl mx-auto px-4 mt-14">
      <h2 className="text-2xl sm:text-3xl font-extrabold mb-5">What we do</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${SVC.map(
          (s) =>
            html`<button
              key=${s.id}
              onClick=${() => go("Services")}
              className="card h p-5 text-left"
            >
              <span
                className="w-11 h-11 rounded-xl bg-amber-50 text-[#8a5a00] grid place-items-center"
                ><${I} n=${s.ic} /></span
              ><b className="block mt-3">${s.t}</b
              ><span className="text-sm text-slate-600"
                >${s.items.length} services</span
              >
            </button>`,
        )}
      </div>
    </section>
    <section className="max-w-6xl mx-auto px-4 mt-14">
      <div className="flex justify-between items-end mb-5">
        <h2 className="text-2xl sm:text-3xl font-extrabold">
          Featured computer parts
        </h2>
        <button
          className="font-bold text-[#8a5a00] min-h-[44px]"
          onClick=${() => go("Shop")}
        >
          View all
        </button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${products
          .filter((p) => p.stock > 0)
          .slice(0, 4)
          .map(
            (p) =>
              html`<${PCard}
                key=${p.id}
                p=${p}
                add=${add}
                view=${view}
                threshold=${settings.low_stock_threshold}
              />`,
          )}
      </div>
      ${demo && html`<p className="text-xs text-slate-600 mt-3">Demo prices and inventory.</p>`}
    </section>
    <section className="max-w-6xl mx-auto px-4 mt-14">
      <h2 className="text-2xl sm:text-3xl font-extrabold mb-5">How it works</h2>
      <div className="grid md:grid-cols-3 gap-4">
        ${[
          [
            "Buying parts",
            "Browse the shop, add items to your cart, and choose delivery or pickup.",
          ],
          [
            "Booking a service",
            "Pick a service, describe the problem, and request a schedule. We confirm the slot with you.",
          ],
          [
            "Requesting a quotation",
            "Tell us what you need built. We review the scope first, then send a quotation.",
          ],
        ].map(
          (s, i) =>
            html`<div key=${i} className="card p-5">
              <span className="font-extrabold text-[#8a5a00]"
                >Step ${i + 1}</span
              ><b className="block mt-1 text-lg">${s[0]}</b>
              <p className="text-slate-600 mt-1">${s[1]}</p>
            </div>`,
        )}
      </div>
    </section>
    <section className="max-w-6xl mx-auto px-4 mt-14 grid md:grid-cols-3 gap-4">
      ${[
        [
          "Clear quotations",
          "You see the scope and price basis before we begin.",
        ],
        [
          "Careful diagnosis",
          "We inspect first, so you pay to fix the actual problem.",
        ],
        [
          "Practical solutions",
          "Right-sized fixes and builds, not unnecessary upgrades.",
        ],
      ].map(
        (a) =>
          html`<div
            key=${a[0]}
            className="p-5 border-l-4 border-[#F7B52C] bg-white rounded-r-xl"
          >
            <b>${a[0]}</b>
            <p className="text-slate-600 text-sm mt-1">${a[1]}</p>
          </div>`,
      )}
    </section>
    <section className="max-w-6xl mx-auto px-4 mt-14">
      <div
        className="hero rounded-3xl text-white p-8 sm:p-12 flex flex-wrap gap-5 items-center justify-between"
      >
        <div className="max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            Have a custom project in mind?
          </h2>
          <p className="text-stone-300 mt-2">
            Websites, automation, AI image processing, or an Arduino/ESP32
            device. Send your requirements and we'll review them.
          </p>
        </div>
        <button className="btn bp" onClick=${() => go("Custom Projects")}>
          Request a Quote
        </button>
      </div>
    </section>
  </div>`;
