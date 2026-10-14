import { useState, useEffect, useRef } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { ShoppingCart, Cpu } from "lucide-react";
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
  const button = useRef(null),
    panel = useRef(null);
  const location = useLocation();
  const active = (path) =>
    path === "/about#contact"
      ? location.pathname === "/about" && location.hash === "#contact"
      : path === "/about"
        ? location.pathname === "/about" && !location.hash
        : path === "/"
          ? location.pathname === "/"
          : location.pathname === path ||
            location.pathname.startsWith(path + "/");
  const close = (focus = false) => {
    setOpen(false);
    if (focus) button.current?.focus();
  };
  useEffect(() => {
    setOpen(false);
  }, [location]);
  useEffect(() => {
    if (!open) return;
    const pointer = (e) => {
      if (
        !panel.current?.contains(e.target) &&
        !button.current?.contains(e.target)
      )
        setOpen(false);
    };
    const key = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", pointer);
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  return (
    <header className="sticky top-0 z-40 bg-ink text-white shadow-lg isolate">
      {settings.banner && (
        <p className="relative z-50 bg-gold text-ink text-center text-sm font-bold p-2">
          {settings.banner}
        </p>
      )}
      <div className="relative z-50 bg-ink max-w-6xl mx-auto px-4 flex items-center justify-between h-16 gap-2">
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
          {nav.map(([label, path]) => (
            <NavLink
              key={label}
              to={path}
              end={path === "/"}
              className={
                "px-3 min-h-11 flex items-center text-sm font-semibold rounded-lg " +
                (active(path) ? "bg-white/10 text-gold" : "hover:bg-white/10")
              }
            >
              {label}
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
            ref={button}
            className={
              "menu-toggle lg:hidden relative w-11 h-11 rounded-lg hover:bg-white/10 " +
              (open ? "is-open" : "")
            }
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
      {open && (
        <div
          aria-hidden="true"
          className="lg:hidden fixed inset-0 z-40 bg-transparent"
          onPointerDown={() => close()}
        />
      )}
      <nav
        ref={panel}
        id="mobile-navigation"
        aria-label="Mobile"
        aria-hidden={!open}
        inert={open ? undefined : ""}
        className={
          "mobile-panel lg:hidden absolute right-3 top-full mt-2 z-50 rounded-2xl bg-ink border border-white/15 shadow-2xl p-2 grid " +
          (open ? "is-open" : "")
        }
      >
        {nav.map(([label, path], index) => (
          <Link
            key={label}
            to={path}
            tabIndex={open ? 0 : -1}
            aria-current={active(path) ? "page" : undefined}
            onClick={() => close(true)}
            className={
              "mobile-menu-item btn justify-start text-sm " +
              (active(path)
                ? "bg-gold text-ink"
                : "text-stone-200 hover:bg-white/10")
            }
            style={{
              "--item-delay":
                (open ? index * 45 : (nav.length - index - 1) * 25) + "ms",
            }}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
