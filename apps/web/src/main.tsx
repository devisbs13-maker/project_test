import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { initTelegram } from "./lib/telegram";
import "./styles/theme.css";

// Initialize Telegram WebApp integration early to avoid a black screen placeholder
try { initTelegram(); } catch {}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <HashRouter>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </HashRouter>
);
