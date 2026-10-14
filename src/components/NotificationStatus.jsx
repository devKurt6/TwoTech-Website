export default function NotificationStatus({ submission }) {
  if (submission.notification !== "failed") return null;
  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm"
      role="status"
      aria-live="polite"
    >
      <p>
        Your request was saved. The notification could not be confirmed. You can
        retry the notification without submitting your request again.
      </p>
      <button
        type="button"
        className="btn bs mt-3"
        disabled={submission.notificationBusy}
        onClick={submission.retryNotification}
      >
        {submission.notificationBusy
          ? "Retrying notification…"
          : "Retry notification"}
      </button>
    </div>
  );
}
