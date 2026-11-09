import { isDesktop } from "./platform";

export default function App() {
  return (
    <main className="app-shell">
      <section className="welcome-card" aria-labelledby="app-title">
        <p className="eyebrow">M0 | FOUNDATION</p>
        <h1 id="app-title">Dashboard Overlay</h1>
        <p className="description">
          The desktop shell is ready for the next milestone.
        </p>
        <p className="runtime" role="status">
          Runtime: {isDesktop ? "Electron desktop" : "Web preview"}
        </p>
      </section>
    </main>
  );
}
