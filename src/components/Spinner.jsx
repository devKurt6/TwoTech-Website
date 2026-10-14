import { useState, useEffect } from "react";
export default function Spinner() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 2000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <p role="status" aria-live="polite" className="p-8 text-center">
      {slow ? "Waking up the server, one moment…" : "Loading…"}
    </p>
  );
}
