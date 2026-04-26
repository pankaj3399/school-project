import { Link, useLocation } from "react-router-dom";

export function Breadcrumb() {
  const location = useLocation();
  const pathname = location.pathname;
  const allSegments = pathname.split("/").filter(Boolean);
  // Drop the leading "system-admin" container segment from the rendered crumbs
  // so SystemAdmin pages read the same as other roles ("Home / Districts"
  // rather than "Home / System Admin / Districts"). Only the position-0 match
  // is dropped — a later "system-admin" segment (e.g. inside a slug) is left
  // intact. Hrefs are still built from the original path.
  const pathSegments = allSegments
    .map((segment, index) => ({ segment, originalIndex: index }))
    .filter(({ segment, originalIndex }) => !(originalIndex === 0 && segment === "system-admin"));

  return (
    <nav className="text-sm breadcrumbs">
      <ul className="flex items-center space-x-2">
        <li>
          <Link to="/" className="text-gray-500 hover:text-gray-700">
            Home
          </Link>
        </li>
        {pathSegments.map(({ segment, originalIndex }, index) => {
          const href = `/${allSegments.slice(0, originalIndex + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;
          const parentSegment = originalIndex > 0 ? allSegments[originalIndex - 1] : undefined;
          let label = segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          if (segment === "new") {
            label = "Add";
          }

          const validParentContexts = ["system-admin", "districts", "schools"];
          
          // Force details label for any segment under districts/schools if it's the last segment
          if (parentSegment !== undefined && validParentContexts.includes(parentSegment) && isLast && !["new", "import", "bulk-import"].includes(segment)) {
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