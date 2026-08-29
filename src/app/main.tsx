import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import "../styles/index.css";
import { getCopy, initLanguage } from "../i18n";
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

// Antes de renderizar: el primer pintado ya sale en el idioma correcto y no
// hay parpadeo de espanol a ingles. El titulo y la descripcion los pone cada
// pagina en un efecto, para que sigan al idioma cuando se cambia.
initLanguage();

const root = document.getElementById("root");
if (!root) throw new Error(getCopy().errors.missingRoot);

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
