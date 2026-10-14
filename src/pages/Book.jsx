import RequestForm from "../components/RequestForm";
export function Booking({ pre }) {
  return (
    <div className="max-w-6xl mx-auto px-4 pt-10">
      <h1 className="text-3xl sm:text-4xl font-extrabold">Book a service</h1>
      <p className="mt-2 mb-6 text-stone-600">
        Request a repair, maintenance, or setup schedule.
      </p>
      <RequestForm kind="bookings" pre={pre} />
    </div>
  );
}
