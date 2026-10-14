import { Link } from "react-router-dom";
export default function FormConsent() {
  return (
    <p className="text-xs font-normal text-stone-600">
      By submitting, you agree to be contacted about your request. Read our{" "}
      <Link
        className="underline text-goldText inline-flex items-center min-h-11"
        to="/privacy"
      >
        Privacy Policy
      </Link>
      .
    </p>
  );
}
