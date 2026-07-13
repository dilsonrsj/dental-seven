import { describe, expect, it } from "vitest";
import { renderLegalMarkdown } from "./render-markdown";

describe("renderLegalMarkdown", () => {
  it("renders headings and paragraphs", () => {
    const nodes = renderLegalMarkdown("# Título\n\nParágrafo inicial.");
    expect(nodes).toHaveLength(2);
  });

  it("parses list items", () => {
    const nodes = renderLegalMarkdown("- Item um\n- Item dois");
    expect(nodes).toHaveLength(1);
  });

  it("parses bold and links", () => {
    const markdown = "Texto com **negrito** e [link](/termos).";
    const nodes = renderLegalMarkdown(markdown);
    expect(nodes).toHaveLength(1);
  });
});
