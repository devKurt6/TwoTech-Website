import { html } from "../lib/html";
import {
  Cpu,
  Monitor,
  Wrench,
  HardDrive,
  Fan,
  Wifi,
  Droplets,
  Check,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Menu,
  X,
  Search,
  Code2,
  Bot,
  CircuitBoard,
  Keyboard,
  MemoryStick,
  Plug,
  Server,
  Info,
  MapPin,
} from "lucide-react";
export { default as Pic } from "./ImageWithFallback";
export { default as Modal } from "./Modal";
const icons = {
  cart: ShoppingCart,
  menu: Menu,
  x: X,
  search: Search,
  code: Code2,
  bot: Bot,
  chip: Cpu,
  pc: Monitor,
  wrench: Wrench,
  disk: HardDrive,
  fan: Fan,
  wifi: Wifi,
  drop: Droplets,
  check: Check,
  plus: Plus,
  minus: Minus,
  trash: Trash2,
  gpu: CircuitBoard,
  kb: Keyboard,
  ram: MemoryStick,
  psu: Plug,
  case: Server,
  info: Info,
  pin: MapPin,
};
export const I = ({ n, s = 20, c = "" }) => {
  const Icon = icons[n] || Info;
  return <Icon size={s} className={c} aria-hidden="true" />;
};
export const Field = ({ l, err, children, help }) =>
  html`<label className="block text-sm font-semibold"
    >${l}${children}${help && html`<span className="block text-xs font-normal text-slate-600 mt-1">${help}</span>`}${err && html`<span role="alert" className="block text-sm text-red-700 mt-1">${err}</span>`}</label
  >`;
export const Head = ({ t, s }) =>
  html`<div className="mb-6">
    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">${t}</h1>
    ${s && html`<p className="mt-2 text-slate-600 max-w-2xl">${s}</p>`}
  </div>`;
