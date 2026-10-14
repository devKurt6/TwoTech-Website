import { Link } from "react-router-dom";
import { nav } from "./Header";
export default function Footer({ settings: s }) {
  return (
    <footer className="bg-ink text-stone-300 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div>
          <p className="text-white font-extrabold text-lg">Two Tech</p>
          <p className="mt-2">
            Computer Engrs' Repair Services. Computer parts, repairs, and custom
            development.
          </p>
        </div>
        <div>
          <h2 className="text-white font-bold">Explore</h2>
          <div className="grid">
            {nav.map(([n, p]) => (
              <Link key={n} className="min-h-11 flex items-center" to={p}>
                {n}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-white font-bold mb-2">Contact</h2>
          <p>{s.phone}</p>
          <p>{s.email}</p>
          <a
            className="underline min-h-11 flex items-center"
            href={s.facebook}
            target="_blank"
            rel="noopener noreferrer"
          >
            Facebook: Engr.TwoTECH
          </a>
        </div>
        <div>
          <h2 className="text-white font-bold mb-2">Hours & area</h2>
          <p>{s.hours}</p>
          <p className="mt-2">{s.address}</p>
          <p>Nearby areas subject to availability.</p>
        </div>
      </div>
      <p className="text-center text-xs pb-6 px-4">
        Demo order and payment flows — owner verification required before
        launch.
      </p>
    </footer>
  );
}
