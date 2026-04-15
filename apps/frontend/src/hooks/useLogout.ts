import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { logout } from "@/api/auth";
import { ME_QUERY_KEY } from "./useMe";

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
      void navigate({ to: "/login" });
    },
  });
}
