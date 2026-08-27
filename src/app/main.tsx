import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import "../styles/index.css";
import { copy } from "../i18n/copy";
import { ProceduresPage } from "../features/procedures/ProceduresPage";
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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/procedimientos" element={<ProceduresPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
