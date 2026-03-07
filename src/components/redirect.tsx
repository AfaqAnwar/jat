import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export function Redirect({ to }: { to: string }) {
  const navigate = useNavigate();
  useEffect(() => {
    void navigate({ to });
  }, [navigate, to]);
  return null;
}
