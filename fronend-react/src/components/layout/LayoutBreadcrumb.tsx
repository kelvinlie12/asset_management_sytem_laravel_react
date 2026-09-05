import { Link, useLocation } from "react-router";
import { ROUTE_TITLES } from "../../config/menu";

const LayoutBreadcrumb: React.FC = () => {
  const location = useLocation();
  const title = ROUTE_TITLES[location.pathname] ?? "Dashboard";

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h2>
      <nav>
        <ol className="flex items-center gap-1.5">
          <li>
            <Link
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
              to="/"
            >
              Home
            </Link>
          </li>
          <span className="text-gray-400 dark:text-gray-600">/</span>
          <li className="text-sm text-gray-800 dark:text-white/90">{title}</li>
        </ol>
      </nav>
    </div>
  );
};

export default LayoutBreadcrumb;
