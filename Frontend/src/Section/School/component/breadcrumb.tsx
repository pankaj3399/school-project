import { Link, useLocation } from "react-router-dom";

export function Breadcrumb() {
  const location = useLocation();
  const pathname = location.pathname;
  const pathSegments = pathname.split("/").filter(Boolean);

  return (
    <nav className="text-sm breadcrumbs">
      <ul className="flex items-center space-x-2">
        <li>
          <Link to="/" className="text-gray-500 hover:text-gray-700">
            Home
          </Link>
        </li>
        {pathSegments.map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;
          const parentSegment = pathSegments[index - 1];
          let label = segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          const validParentContexts = ["system-admin", "districts", "schools"];
          
          // Force details label for any segment under districts/schools if it's the last segment
          if (validParentContexts.includes(parentSegment) && isLast) {
            if (parentSegment === "schools") {
              label = "School Details";
            } else if (parentSegment === "districts") {
              label = "District Details";
            }
          }
        

          return (
            <li key={href} className="flex items-center">
              <span className="text-gray-500 mx-2">/</span>
              {isLast ? (
                <span className="text-gray-900 font-medium">{label}</span>
              ) : (
                <Link to={href} className="text-gray-500 hover:text-gray-700">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}