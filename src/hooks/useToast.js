import { useState, useEffect } from "react";
export function useToast() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(""), 4000);
    return () => clearTimeout(timeout);
  }, [message]);
  return [message, setMessage];
}
