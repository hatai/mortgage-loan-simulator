import { Link } from "@tanstack/react-router";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg print:hidden">
      <nav className="mx-auto flex max-w-7xl items-center gap-x-4 py-3">
        <h1 className="flex-shrink-0 text-base font-bold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[var(--sea-ink)] no-underline"
          >
            <span className="text-lg">🏠</span>
            住宅ローンシミュレーター
          </Link>
        </h1>

        <div className="ml-auto flex items-center gap-2 text-sm font-medium">
          <Link
            to="/"
            className="nav-link"
            activeProps={{ className: "nav-link is-active" }}
          >
            シミュレーター
          </Link>
          <Link
            to="/plans"
            className="nav-link"
            activeProps={{ className: "nav-link is-active" }}
          >
            保存済みプラン
          </Link>
          <Link
            to="/compare"
            className="nav-link"
            activeProps={{ className: "nav-link is-active" }}
          >
            比較
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
