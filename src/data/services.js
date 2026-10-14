export const SVC = [
  {
    id: "dev",
    t: "Programming & Software Development",
    ic: "code",
    mode: "quote",
    from: "Quote-based",
    d: "Software built around how your business actually works.",
    items: [
      "Website development",
      "Business systems & desktop apps",
      "Custom Python applications",
      "API integration",
      "Bug fixing & system maintenance",
    ],
  },
  {
    id: "auto",
    t: "Automation & AI",
    ic: "bot",
    mode: "quote",
    from: "Quote-based",
    d: "Remove repetitive work and add smart features.",
    items: [
      "Excel/VBA automation",
      "Workflow automation",
      "Chatbot development",
      "Image processing & object detection",
    ],
  },
  {
    id: "emb",
    t: "Embedded Systems & IoT",
    ic: "chip",
    mode: "quote",
    from: "Quote-based",
    d: "Hardware and firmware built to sense and respond.",
    items: [
      "Arduino & ESP32 programming",
      "Sensor integration",
      "Monitoring systems",
      "Smart device development",
      "Custom embedded projects",
    ],
  },
  {
    id: "setup",
    t: "Computer Setup & Upgrades",
    ic: "pc",
    mode: "book",
    from: "From ₱500*",
    d: "Build it right or upgrade what you have.",
    items: [
      "Custom PC assembly",
      "Parts compatibility assessment",
      "RAM & SSD upgrades",
      "GPU installation",
      "Operating system & driver setup",
    ],
    modes: ["Drop-off", "Onsite"],
  },
  {
    id: "repair",
    t: "Computer Repair & Troubleshooting",
    ic: "wrench",
    mode: "book",
    from: "Diagnosis from ₱300*",
    d: "Careful diagnosis before any parts are replaced.",
    items: [
      "No-display & boot issue diagnosis",
      "Overheating & sudden shutdown",
      "Slow computer troubleshooting",
      "Hardware & software diagnosis",
    ],
    modes: ["Drop-off", "Onsite"],
  },
  {
    id: "soft",
    t: "Formatting & Software",
    ic: "disk",
    mode: "book",
    from: "From ₱500*",
    d: "Clean installs, with your files backed up first.",
    items: [
      "Windows installation/reinstallation",
      "Computer formatting",
      "Driver installation",
      "Licensed software setup",
      "Malware removal",
      "Data backup before formatting",
    ],
    modes: ["Drop-off", "Onsite", "Remote"],
  },
  {
    id: "clean",
    t: "Cleaning & Cooling Maintenance",
    ic: "drop",
    mode: "book",
    from: "From ₱400*",
    d: "Lower temperatures and quieter fans. GPU service depends on the card model and condition, and is not suitable for every card.",
    items: [
      "System unit deep cleaning",
      "CPU thermal paste replacement",
      "GPU cleaning & thermal paste",
      "Thermal pad inspection/replacement where appropriate",
    ],
    modes: ["Drop-off", "Onsite"],
  },
  {
    id: "net",
    t: "Network & IT Support",
    ic: "wifi",
    mode: "book",
    from: "From ₱500*",
    d: "Stable Wi-Fi, shared files, and printers that print.",
    items: [
      "Router & Wi-Fi setup",
      "LAN troubleshooting",
      "Printer setup",
      "File sharing setup",
      "Remote & onsite technical support",
    ],
    modes: ["Onsite", "Remote"],
  },
];
export const BOOKABLE = SVC.filter((s) => s.mode === "book").flatMap((g) =>
  g.items.map((n) => ({ n, g: g.id, modes: g.modes })),
);
export const defaultServices = SVC.map((s) => ({
  id: s.id,
  title: s.t,
  description: s.d,
  visible: true,
  starting_price:
    { setup: 500, repair: 300, soft: 500, clean: 400, net: 500 }[s.id] ?? null,
  price_label: s.id === "repair" ? "Diagnosis from" : "From",
  items: s.items.map((name) => ({ name, price: null })),
  modes: s.modes || [],
}));
export function getServices(settings) {
  return SVC.map((s) => {
    const c =
      settings?.services?.find((v) => v.id === s.id) ||
      defaultServices.find((v) => v.id === s.id);
    return {
      ...s,
      t: c.title,
      d: c.description,
      visible: c.visible,
      modes: c.modes,
      from:
        s.mode === "quote"
          ? "Quote-based"
          : `${c.price_label} ₱${typeof c.starting_price === "number" && Number.isFinite(c.starting_price) ? c.starting_price.toLocaleString("en-PH") : "—"}*`,
      items: c.items.map((i) => i.name),
      item_prices: Object.fromEntries(c.items.map((i) => [i.name, i.price])),
    };
  }).filter((s) => s.visible);
}
export const getBookable = (settings) =>
  getServices(settings)
    .filter((s) => s.mode === "book")
    .flatMap((g) => g.items.map((n) => ({ n, g: g.id, modes: g.modes })));
export function serviceErrors(services) {
  const errors = {},
    names = new Set();
  if (
    !Array.isArray(services) ||
    services.length !== SVC.length ||
    new Set(services.map((s) => s.id)).size !== SVC.length
  )
    return {
      services:
        "Keep all eight service groups; hide unavailable groups instead.",
    };
  for (const s of services) {
    const group = SVC.find((g) => g.id === s.id);
    if (!group) {
      errors.services = "Unknown service group.";
      continue;
    }
    const money = (n) =>
      typeof n === "number" &&
      Number.isFinite(n) &&
      n >= 0 &&
      n <= 999999 &&
      Math.abs(n * 100 - Math.round(n * 100)) < 1e-5;
    if (group.mode === "book" && !money(s.starting_price))
      errors[s.id] =
        "Enter a starting price from 0 to 999,999 with at most two decimals.";
    if (
      !s.title?.trim() ||
      s.title.length > 150 ||
      !s.description?.trim() ||
      s.description.length > 5000
    )
      errors[s.id] =
        "Enter a title (up to 150 characters) and description (up to 5,000).";
    if (!s.price_label?.trim() || s.price_label.length > 50)
      errors[s.id] = "Enter a price label up to 50 characters.";
    if (!s.items?.length || s.items.length > 40)
      errors[s.id] = "Enter 1–40 inclusions.";
    for (const item of s.items || []) {
      if (
        !item.name?.trim() ||
        item.name.length > 200 ||
        names.has(item.name.trim())
      )
        errors[s.id] = "Use unique inclusion names of 1–200 characters.";
      names.add(item.name?.trim());
      if (item.price !== null && !money(item.price))
        errors[s.id] =
          "Use valid inclusion prices with at most two decimals, or leave them blank.";
    }
    if (
      group.mode === "book" &&
      (!s.modes?.length ||
        s.modes.some((m) => !["Drop-off", "Onsite", "Remote"].includes(m)))
    )
      errors[s.id] = "Choose at least one supported service mode.";
  }
  return errors;
}
