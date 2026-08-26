import { describe, expect, it } from "vitest";
import React from "react";
import { MarkdownRenderer, parseBlocks } from "./MarkdownRenderer";

describe("MarkdownRenderer Block Parser", () => {
  it("detecta y parsea múltiples tipos de bloques Markdown", () => {
    const md = `
Texto inicial con **negrita** y *cursiva*.

| Nombre | Edad | Ciudad |
| :--- | :---: | ---: |
| Juan | 20 | Guatemala |
| Carlos | 21 | México |

* Elemento de lista 1
* Elemento de lista 2

\`\`\`sql
SELECT * FROM query.v_awards;
\`\`\`

> Esta es una cita de prueba.

### Encabezado 3
`;
    const blocks = parseBlocks(md);
    expect(blocks.length).toBe(6);
    expect(blocks[0]?.type).toBe("paragraph");
    expect(blocks[1]?.type).toBe("table");
    expect(blocks[2]?.type).toBe("list");
    expect(blocks[3]?.type).toBe("code");
    expect(blocks[4]?.type).toBe("blockquote");
    expect(blocks[5]?.type).toBe("heading");
  });

  it("devuelve null cuando el contenido está vacío", () => {
    expect(MarkdownRenderer({ content: "" })).toBeNull();
  });

  it("crea el elemento React adecuado para el renderer", () => {
    const element = React.createElement(MarkdownRenderer, {
      content: "| Col 1 | Col 2 |\n|---|---|\n| A | B |",
    });
    expect(element).not.toBeNull();
    expect(element.type).toBe(MarkdownRenderer);
  });
});

