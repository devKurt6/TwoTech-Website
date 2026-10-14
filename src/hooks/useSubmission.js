import { useRef, useState } from "react";
import { validate } from "../lib/validators";
import { submitNetlifyCopy } from "../lib/netlifyForms";
export function useSubmission(kind, send, notificationData = (data) => data) {
  const [errors, setErrors] = useState({}),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(null),
    [honeypot, setHoneypot] = useState("");
  const inFlight = useRef(false);
  const notificationPayload = useRef(null),
    notificationFlight = useRef(false);
  const [notification, setNotification] = useState(null),
    [notificationBusy, setNotificationBusy] = useState(false);
  async function retryNotification() {
    if (!notificationPayload.current || notificationFlight.current) return;
    notificationFlight.current = true;
    setNotificationBusy(true);
    try {
      const { data, ref } = notificationPayload.current;
      const ok = await submitNetlifyCopy(kind, data, ref);
      setNotification(ok ? "received" : "failed");
      if (ok) notificationPayload.current = null;
    } finally {
      notificationFlight.current = false;
      setNotificationBusy(false);
    }
  }
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
      const result = await send({ ...f, website: honeypot });
      try {
        sessionStorage.setItem("tt-submit-" + kind, String(Date.now()));
      } catch {
        /* Best-effort throttling. */
      }
      setDone(result);
      scrollTo(0, 0);
      notificationPayload.current = {
        data: notificationData(f, result),
        ref: result.ref,
      };
      await retryNotification();
    } catch (err) {
      const fields = Object.fromEntries(
        Object.entries(err.fields || {}).map(([key, value]) => [
          key.replace(/^customer\./, ""),
          value,
        ]),
      );
      setErrors({
        ...fields,
        form: err.message + " Please check your connection and retry.",
      });
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }
  return {
    errors,
    busy,
    done,
    setDone,
    submit,
    honeypot,
    setHoneypot,
    notification,
    notificationBusy,
    retryNotification,
  };
}
