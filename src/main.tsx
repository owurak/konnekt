import { Component, StrictMode, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Konnekt runtime error", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAF9] p-6 text-[#142019]">
          <div className="max-w-xl rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <span className="font-heading text-2xl font-bold">!</span>
            </div>
            <h1 className="font-heading text-2xl font-bold">Konnekt could not load</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              A runtime error stopped the app from rendering. Check the browser console for the full error, then reload after fixing it.
            </p>
            <pre className="mt-4 max-h-40 overflow-auto rounded-2xl bg-slate-950 p-4 text-left text-xs text-white">
              {this.state.error.message}
            </pre>
            <button
              className="mt-5 rounded-2xl bg-[#0B6B3A] px-5 py-3 text-sm font-semibold text-white"
              type="button"
              onClick={() => window.location.reload()}

             
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.error("Konnekt service worker registration failed", error);
    });
  });
}
