import { afterEach, describe, expect, it, vi } from "vitest";

import { copyText } from "./CopyTextButton";

afterEach(() => vi.unstubAllGlobals());

describe("copiar el texto de un mensaje", () => {
  it("conserva el texto exacto, incluidos acentos y saltos de linea", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const text = "Compara Guatemala y Costa Rica.\nPor país y mes.";
    expect(await copyText(text)).toBe(true);
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(text);
  });

  it("informa que no se copio si el navegador rechaza el portapapeles", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error()) },
    });
    expect(await copyText("Mi pregunta")).toBe(false);
  });

  it("tolera un navegador sin API de portapapeles", async () => {
    vi.stubGlobal("navigator", {});
    expect(await copyText("Mi pregunta")).toBe(false);
  });
});
