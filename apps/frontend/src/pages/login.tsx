import { LoginView } from "@/features/auth/login";

export default function LoginPage() {
  const hashSearch = window.location.hash.includes("?")
    ? window.location.hash.slice(window.location.hash.indexOf("?") + 1)
    : window.location.search.slice(1);
  const params = new URLSearchParams(hashSearch);
  const authError = params.get("error");
  return <LoginView authError={authError} />;
}
