import RequestForm from "../components/RequestForm";
import { useSettings } from "../hooks/useSettings";
import DataState from "../components/DataState";
export function About() {
  const resource = useSettings(),
    s = resource.data;
  return (
    <DataState resource={resource}>
      <div className="max-w-6xl mx-auto px-4 pt-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-6">
          About Two Tech
        </h1>
        <p className="max-w-2xl text-stone-700">
          Two Tech (Computer Engrs' Repair Services) is a Philippines-based
          business offering computer parts, repair and maintenance, software
          development, automation, and embedded systems projects.
        </p>
        <section className="card p-5 mt-6 max-w-3xl">
          <h2 className="font-extrabold text-lg">Founder: Kurt Decena</h2>
          <p className="mt-3 text-stone-700 whitespace-pre-line">
            {s.founder_bio}
          </p>
        </section>
        <section className="mt-8 grid lg:grid-cols-2 gap-5" id="contact">
          <div>
            <h2 className="text-2xl font-extrabold">Contact</h2>
            <div className="card p-5 mt-3 grid gap-3 text-sm">
              <p>
                <b>Phone:</b>{" "}
                <a
                  className="inline-flex items-center min-h-11"
                  href={"tel:" + s.phone.replace(/\s/g, "")}
                >
                  {s.phone}
                </a>
              </p>
              <p>
                <b>Email:</b>{" "}
                <a
                  className="inline-flex items-center min-h-11"
                  href={"mailto:" + s.email}
                >
                  {s.email}
                </a>
              </p>
              <a
                className="underline text-goldText min-h-11 flex items-center"
                href={s.facebook}
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook: Engr.TwoTECH
              </a>
              <p>{s.address}</p>
              <p>Nearby areas subject to availability.</p>
              <a
                className="underline text-goldText min-h-11 flex items-center"
                href="https://maps.app.goo.gl/KLWRCZbpFzx4qBjE8"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Google Maps
              </a>
              <p>
                <b>Hours:</b> {s.hours}
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold mb-3">Send a message</h2>
            <RequestForm kind="messages" />
          </div>
        </section>
      </div>
    </DataState>
  );
}
