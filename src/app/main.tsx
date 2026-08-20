import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "../styles/index.css";
import { copy } from "../i18n/copy";
import { App } from "./App";

// Los datos solo cambian cuando corre el ETL, asi que no tiene sentido refetch
// agresivo. La frescura real la marca `data_version` en cada respuesta.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const root = document.getElementById("root");
if (!root) throw new Error(copy.errors.missingRoot);

document.title = copy.document.title;
document
  .querySelector('meta[name="description"]')
  ?.setAttribute("content", copy.document.description);

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
