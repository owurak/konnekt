import { useNavigate } from "react-router-dom";
import { Button, EmptyState } from "@/components/ui";

export function NotFound() {
  const navigate = useNavigate();
  return (
    <EmptyState title="Page not found" description="The page you requested does not exist in Konnekt." action={<Button onClick={() => navigate("/")}>Go home</Button>} />
  );
}
