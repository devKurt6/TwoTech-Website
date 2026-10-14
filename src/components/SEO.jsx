import { useEffect } from "react";
import { useLocation } from "react-router-dom";
export default function SEO({
  title,
  description = "Computer parts, repairs, maintenance, software, automation and embedded systems in Santo Tomas, Batangas.",
  settings,
}) {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = title + " | Two Tech";
    const values = {
      description,
      "og:title": document.title,
      "og:description": description,
      "og:type": "website",
      "og:url": location.origin + pathname,
      robots: pathname.startsWith("/admin")
        ? "noindex, nofollow"
        : "index, follow",
    };
    for (const [name, content] of Object.entries(values)) {
      let m = document.head.querySelector(
        `meta[${name.startsWith("og:") ? "property" : "name"}="${name}"]`,
      );
      if (!m) {
        m = document.createElement("meta");
        m.setAttribute(name.startsWith("og:") ? "property" : "name", name);
        document.head.append(m);
      }
      m.content = content;
    }
    let script;
    if (pathname === "/" && settings) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "Two Tech",
        description: "Computer Engrs’ Repair Services",
        telephone: settings.phone,
        email: settings.email,
        address: settings.address,
        url: location.origin,
        sameAs: [settings.facebook],
      });
      document.head.append(script);
    }
    return () => script?.remove();
  }, [title, description, pathname, settings]);
  return null;
}
