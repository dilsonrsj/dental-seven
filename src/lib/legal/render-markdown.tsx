import React, { type ReactNode } from "react";
import Link from "next/link";

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[2] && match[3]) {
      const href = match[3];
      const isInternal = href.startsWith("/");
      nodes.push(
        isInternal ? (
          <Link key={key++} href={href} className="text-primary hover:underline">
            {match[2]}
          </Link>
        ) : (
          <a
            key={key++}
            href={href}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {match[2]}
          </a>
        ),
      );
    } else if (match[4]) {
      nodes.push(
        <strong key={key++} className="font-semibold text-foreground">
          {match[4]}
        </strong>,
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

export function renderLegalMarkdown(markdown: string): ReactNode[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let key = 0;

  function flushParagraph() {
    if (paragraph.length === 0) return;
    const text = paragraph.join(" ").trim();
    if (text) {
      nodes.push(
        <p key={key++} className="text-sm leading-relaxed text-muted-foreground">
          {parseInline(text)}
        </p>,
      );
    }
    paragraph = [];
  }

  function flushList() {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={key++} className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {listItems.map((item, index) => (
          <li key={index}>{parseInline(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushList();
      nodes.push(
        <h3 key={key++} className="mt-6 font-display text-base font-semibold text-foreground">
          {trimmed.slice(4)}
        </h3>,
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      nodes.push(
        <h2 key={key++} className="mt-8 font-display text-lg font-semibold text-foreground">
          {trimmed.slice(3)}
        </h2>,
      );
      continue;
    }

    if (trimmed.startsWith("# ")) {
      flushParagraph();
      flushList();
      nodes.push(
        <h1 key={key++} className="font-display text-2xl font-bold tracking-tight text-foreground">
          {trimmed.slice(2)}
        </h1>,
      );
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph();
      listItems.push(trimmed.slice(2));
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();

  return nodes;
}
