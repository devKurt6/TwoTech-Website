import { useState, useEffect } from "react";
import { Cpu } from "lucide-react";
export default function ImageWithFallback({ p, big = false }) {
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [p.img]);
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-ink to-gold grid place-items-center text-white">
      {p.img && !bad ? (
        <img
          className="w-full h-full object-cover"
          src={p.img}
          alt={p.name}
          onError={() => setBad(true)}
        />
      ) : (
        <Cpu aria-hidden="true" size={big ? 96 : 64} />
      )}
    </div>
  );
}
