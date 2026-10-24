import React from "react";

interface FormattedChatMessageProps {
  content: string;
}

/**
 * Parses inline markdown-like patterns:
 * - **bold** or __bold__
 * - *italic* or _italic_
 * - `code`
 * - [label](url)
 * Renders high-contrast, crisp typography for both light and dark themes.
 */
function renderInline(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match: **bold**, __bold__, `code`, [label](url), *italic*, _italic_
  const tokenRegex = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*|(?<=\s|^)_[^_]+_(?=\s|$|[.,!?]))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold: **text** or __text__
    if (
      (part.startsWith("**") && part.endsWith("**") && part.length >= 4) ||
      (part.startsWith("__") && part.endsWith("__") && part.length >= 4)
    ) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-[#173b3b]">
          {inner}
        </strong>
      );
    }

    // Inline Code: `text`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-[#e4e9e3] text-[#1d5b48] font-mono text-[11px] border border-[#d2dace]"
        >
          {inner}
        </code>
      );
    }

    // Markdown link: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#246b55] font-medium underline hover:text-[#173b3b]"
        >
          {linkMatch[1]}
        </a>
      );
    }

    // Italic: *text* or _text_
    if (
      (part.startsWith("*") && part.endsWith("*") && part.length >= 2) ||
      (part.startsWith("_") && part.endsWith("_") && part.length >= 2)
    ) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic text-[#374c44]">
          {inner}
        </em>
      );
    }

    // Strip any residual dangling/unmatched markdown tokens like lone ** or ###
    const cleaned = part
      .replace(/\*\*/g, "")
      .replace(/^#{1,6}\s*/g, "");

    return (
      <span key={index} className="text-[#20312d]">
        {cleaned}
      </span>
    );
  });
}

/**
 * Rich chat response formatter for AI Copilot.
 * Replaces raw markdown symbols (###, **, -, 1.) with clean, modern, highly visible UI components.
 */
export function FormattedChatMessage({ content }: FormattedChatMessageProps) {
  if (!content) return null;

  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];

  let currentList: {
    type: "ul" | "ol";
    items: string[];
    startNum?: number;
  } | null = null;

  const flushList = () => {
    if (!currentList) return;
    const isUl = currentList.type === "ul";
    const listKey = `list-${elements.length}`;

    elements.push(
      <div key={listKey} className="my-2 space-y-1.5">
        {currentList.items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2 text-[#20312d] leading-relaxed">
            {isUl ? (
              <span className="text-[#246b55] font-bold shrink-0 text-sm leading-none mt-1">•</span>
            ) : (
              <span className="text-[#246b55] font-bold text-xs shrink-0 mt-0.5">
                {(currentList?.startNum || 1) + idx}.
              </span>
            )}
            <div className="flex-1 text-[#20312d] leading-relaxed">{renderInline(item)}</div>
          </div>
        ))}
      </div>
    );
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Blank line -> separates paragraphs / flushes list
    if (!trimmed) {
      flushList();
      continue;
    }

    // Horizontal rule: --- or *** or ___
    if (/^(?:---|---|\*\*\*|___)$/.test(trimmed)) {
      flushList();
      elements.push(<hr key={`hr-${i}`} className="border-[#cbd3ca] my-2" />);
      continue;
    }

    // Headings: # Heading, ## Heading, ### Heading, #### Heading
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];

      elements.push(
        <div
          key={`h-${i}`}
          className={`font-bold text-[#173b3b] flex items-center gap-1.5 ${
            level <= 2 ? "text-sm mt-3 mb-1" : "text-xs mt-2.5 mb-1"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#246b55] shrink-0" />
          <span>{renderInline(headingText)}</span>
        </div>
      );
      continue;
    }

    // Unordered bullet: - item or * item or • item
    const bulletMatch = trimmed.match(/^[-*•+]\s+(.*)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Ordered list item: 1. item, 2. item
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      const num = parseInt(orderedMatch[1], 10);
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [], startNum: num };
      }
      currentList.items.push(orderedMatch[2]);
      continue;
    }

    // Regular text paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-[#20312d] my-1 leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-1.5 text-xs text-[#20312d]">{elements}</div>;
}
