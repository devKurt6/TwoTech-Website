import { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Menu, ShoppingCart, X, Cpu } from "lucide-react";
export const nav = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["Services", "/services"],
  ["Custom Projects", "/quote"],
  ["About", "/about"],
  ["Contact", "/about#contact"],
];
export default function Header({ count, settings }) {
  const [open, setOpen] = useState(false),
    [bad, setBad] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location]);
  useEffect(() => {
    const key = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  return (
    <header className="sticky top-0 z-40 bg-ink text-white shadow-lg">
      {settings.banner && (
        <p className="bg-gold text-ink text-center text-sm font-bold p-2">
          {settings.banner}
        </p>
      )}
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16 gap-2">
        <Link
          to="/"
          className="flex items-center gap-2 font-extrabold text-lg shrink-0 min-h-11"
        >
          {!bad ? (
            <img
              src="/logo.png"
              alt=""
              className="w-9 h-9 object-contain"
              onError={() => setBad(true)}
            />
          ) : (
            <Cpu className="w-9 h-9 bg-gold text-ink p-2 rounded-lg" />
          )}
          <span>
            Two<span className="text-gold">Tech</span>
          </span>
          <span className="hidden md:inline text-xs text-stone-300 max-w-36">
            Computer Engrs' Repair Services
          </span>
        </Link>
        <nav aria-label="Main" className="hidden lg:flex">
          {nav.map(([n, p]) => (
            <NavLink
              key={n}
              to={p}
              end={p === "/"}
              className="px-3 min-h-11 flex items-center text-sm font-semibold hover:bg-white/10 rounded-lg"
            >
              {n}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center">
          <Link
            className="relative p-3"
            to="/cart"
            aria-label={`Cart, ${count} items`}
          >
            <ShoppingCart />
            {count > 0 && (
              <span className="absolute right-0 top-0 bg-gold text-ink text-xs rounded-full px-1.5">
                {count}
              </span>
            )}
          </Link>
          <button
            className="p-3 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          aria-label="Mobile"
          className="absolute right-3 top-full mt-2 w-56 bg-ink border border-white/20 rounded-2xl shadow-2xl p-2 grid"
        >
          {nav.map(([n, p]) => (
            <Link
              className="btn justify-start hover:bg-white/10"
              key={n}
              to={p}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
