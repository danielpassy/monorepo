import { client } from "./generated/client.gen";
import { settings } from "@/settings";

client.setConfig({
  baseUrl: settings.apiBaseUrl,
  credentials: "include",
});

client.interceptors.response.use((response) => {
  if (response.status === 401) {
    if (window.location.hash !== "#/login") {
      window.location.hash = "/login";
    }
  }
  return response;
});

export { client };
