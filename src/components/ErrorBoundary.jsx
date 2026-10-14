import { Component } from "react";
export default class ErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error)
      return (
        <main className="max-w-xl mx-auto p-6">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-3">Please reload the page and try again.</p>
          <button className="btn bp mt-4" onClick={() => location.reload()}>
            Reload
          </button>
        </main>
      );
    return this.props.children;
  }
}
