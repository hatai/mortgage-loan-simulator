import { Link } from "@tanstack/react-router";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white px-4 print:hidden">
      <nav className="mx-auto flex max-w-7xl items-center gap-x-4 py-3">
        <h1 className="flex-shrink-0 text-base tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-900 font-semibold no-underline"
          >
            住宅ローンシミュレーター
          </Link>
        </h1>

        <div className="ml-auto flex items-center gap-2 text-sm font-medium">
          <Link
            to="/"
            className="text-gray-500 hover:text-gray-900 px-2 py-1 rounded transition-colors"
            activeProps={{ className: "text-gray-900 px-2 py-1 rounded transition-colors" }}
          >
            シミュレーター
          </Link>
          <Link
            to="/plans"
            className="text-gray-500 hover:text-gray-900 px-2 py-1 rounded transition-colors"
            activeProps={{ className: "text-gray-900 px-2 py-1 rounded transition-colors" }}
          >
            保存済みプラン
          </Link>
          <Link
            to="/compare"
            className="text-gray-500 hover:text-gray-900 px-2 py-1 rounded transition-colors"
            activeProps={{ className: "text-gray-900 px-2 py-1 rounded transition-colors" }}
          >
            比較
          </Link>
        </div>
      </nav>
    </header>
  );
}
