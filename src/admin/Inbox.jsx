import { useToast } from "../hooks/useToast";
import { useState, useCallback } from "react";
import { api } from "../lib/api";
import { useResource } from "../hooks/useResource";
import DataState from "../components/DataState";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import InboxDetail from "./InboxDetail";
import { P } from "../lib/format";
export default function Inbox() {
  const [table, setTable] = useState("orders"),
    [selected, setSelected] = useState(null),
    [toast, setToast] = useToast();
  const loader = useCallback(() => api.inbox(table), [table]);
  const resource = useResource(loader);
  const labels = {
    orders: "Orders",
    bookings: "Bookings",
    quotes: "Quotes",
    messages: "Messages",
  };
  return (
    <>
      <h1 className="text-2xl font-extrabold">Inbox</h1>
      <nav className="flex flex-wrap gap-2 mt-4" aria-label="Inbox categories">
        {Object.entries(labels).map(([key, label]) => (
          <button
            key={key}
            aria-pressed={table === key}
            className={"btn " + (table === key ? "bp" : "bs")}
            onClick={() => {
              setTable(key);
              setSelected(null);
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="mt-4">
        <DataState resource={resource}>
          {resource.data.length ? (
            <ul className="grid gap-3">
              {resource.data.map((r) => (
                <li
                  key={r.id}
                  className="card p-4 flex flex-wrap gap-3 items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <b>{r.customer_name || r.name}</b>
                    <p className="text-sm text-stone-600 break-all">{r.ref}</p>
                    <p className="text-sm">
                      {r.service ||
                        r.title ||
                        r.body?.slice(0, 120) ||
                        P(r.total)}
                    </p>
                    <p className="text-xs text-stone-600 mt-1">
                      {new Date(r.created_at).toLocaleString("en-PH", {
                        timeZone: "Asia/Manila",
                      })}
                    </p>
                  </div>
                  <span className="bg-amber-50 text-goldText rounded-full px-2 py-1 text-xs font-bold">
                    {r.status || (r.handled ? "handled" : "unhandled")}
                  </span>
                  <button className="btn bs" onClick={() => setSelected(r)}>
                    View details
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing here yet" />
          )}
        </DataState>
      </div>
      {selected && (
        <Modal
          title={labels[table] + " detail"}
          onClose={() => setSelected(null)}
        >
          <InboxDetail
            table={table}
            row={selected}
            onSaved={(message) => {
              setSelected(null);
              resource.reload();
              setToast(message);
            }}
          />
        </Modal>
      )}
      <Toast message={toast} />
    </>
  );
}
