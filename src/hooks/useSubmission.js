import { useRef, useState } from "react";
import { validate } from "../lib/validators";
export function useSubmission(kind, send) {
  const [errors, setErrors] = useState({}),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(null),
    [honeypot, setHoneypot] = useState("");
  const inFlight = useRef(false);
  async function submit(e, f) {
    e.preventDefault();
    if (inFlight.current) return;
    const x = validate(f, kind);
    setErrors(x);
    if (Object.keys(x).length) return;
    if (honeypot) {
      setErrors({ form: "Please leave the website field empty." });
      return;
    }
    let last;
    try {
      last = Number(sessionStorage.getItem("tt-submit-" + kind) || 0);
    } catch {
      last = 0;
    }
    if (Date.now() - last < 30000) {
      setErrors({
        form: "Please wait 30 seconds before sending another request.",
      });
      return;
    }
    inFlight.current = true;
    setBusy(true);
    try {
      const result = await send(f);
      try {
        sessionStorage.setItem("tt-submit-" + kind, String(Date.now()));
      } catch {
        /* Best-effort throttling. */
      }
      setDone(result);
      scrollTo(0, 0);
    } catch (err) {
      setErrors({
        form: err.message + " Please check your connection and retry.",
      });
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }
  return { errors, busy, done, setDone, submit, honeypot, setHoneypot };
}
