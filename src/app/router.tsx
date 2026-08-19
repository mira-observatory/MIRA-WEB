import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AskPage } from "../features/ask/AskPage";
import { App } from "./App";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/preguntar" element={<AskPage />} />
      </Routes>
    </BrowserRouter>
  );
}
