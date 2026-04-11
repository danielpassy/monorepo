import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMe } from "@/hooks/useMe";

interface RouteGuardProps {
  children: ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { data: user, isLoading, isError } = useMe();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      navigate({ to: "/login" });
    }
  }, [isLoading, isError, user, navigate]);

  if (isLoading) return null;
  if (isError || !user) return null;

  return <>{children}</>;
}
