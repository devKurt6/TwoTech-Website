import RequestForm from "../components/RequestForm";
export function Project() {
  return (
    <div className="max-w-6xl mx-auto px-4 pt-10">
      <h1 className="text-3xl sm:text-4xl font-extrabold">Custom projects</h1>
      <p className="mt-2 mb-6 text-stone-600">
        Tell us what you want to build. We review every request before sending a
        quotation.
      </p>
      <RequestForm kind="quotes" />
    </div>
  );
}
