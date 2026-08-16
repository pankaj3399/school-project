import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/authContext";
import { homePathFor } from "@/lib/roleAccess";

export default function UnauthorizedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const homePath = homePathFor(user);
  const reason =
    (location.state as { reason?: string } | null)?.reason ||
    "This page is not available for your role.";

  return (
    <div className="max-w-lg mx-auto mt-16 p-8 bg-white rounded-lg border border-gray-200">
      <h1 className="text-2xl font-bold text-gray-900">You don't have access</h1>
      <p className="mt-3 text-gray-600">{reason}</p>
      <p className="mt-2 text-sm text-gray-500">
        If you think this is a mistake, go back or open a page your role can use.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={() => navigate(-1)}>Go back</Button>
        <Button variant="outline" asChild>
          <Link to={homePath}>Go to home</Link>
        </Button>
      </div>
    </div>
  );
}
