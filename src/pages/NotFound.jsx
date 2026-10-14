import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState";
export default function NotFound() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <EmptyState title="Page not found">
        <p>Let's get you back to Two Tech.</p>
        <Link to="/" className="btn bp mt-4">
          Back to home
        </Link>
      </EmptyState>
    </div>
  );
}
