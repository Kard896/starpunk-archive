import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import type { Root, Text, PhrasingContent, Link } from "mdast";

// Options for the plugin
type Options = {
  terms: Record<string, string>; // lowercase term -> URL
  caseInsensitive?: boolean;     // default: true
  maxPerPage?: number;           // default: 5 occurrences total (sum of all terms)
  linkHeadings?: boolean;        // default: false (don’t auto-link inside headings)
  possessivesAndPlurals?: boolean; // default: true — link “Deralo’s”, “Groks”
};

export const remarkAutoLinkTerms: Plugin<[Options]> = (opts) => {
  const {
    terms,
    caseInsensitive = true,
    maxPerPage = 5,
    linkHeadings = false,
    possessivesAndPlurals = true,
  } = opts || { terms: {} };

  const keys = Object.keys(terms);
  if (!keys.length) return () => {};

  // Build one big regex with word boundaries, optionally accepting 's/s endings
  // Example: \b(deralo|luna|grok|weex|qt314)(?:'s|s)?\b
  const escaped = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const tail = possessivesAndPlurals ? "(?:'s|s)?" : "";
  const flags = caseInsensitive ? "gi" : "g";
  const pattern = new RegExp(`\\b(${escaped.join("|")})${tail}\\b`, flags);

  return (tree: Root) => {
    let totalLinked = 0;

    visit(tree, (node, _idx, parent) => {
      // Skip headings if requested
      if (!linkHeadings && node.type === "heading") return "skip";

      // Don’t descend into links or code regions
      if (node.type === "link" || node.type === "inlineCode" || node.type === "code") {
        return "skip";
      }
    });

    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || totalLinked >= maxPerPage) return;
      // Don’t touch text that’s already inside links or code
      const parentType = parent.type;
      if (["link", "inlineCode", "code"].includes(parentType)) return;

      const value = node.value;
      if (!pattern.test(value)) {
        pattern.lastIndex = 0; // reset just in case
        return;
      }

      // Split text into (text | link) nodes
      pattern.lastIndex = 0;
      const newChildren: PhrasingContent[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(value)) && totalLinked < maxPerPage) {
        const mStart = match.index;
        const mEnd = mStart + match[0].length;
        const core = match[1]; // the core matched term (without 's/s)

        // Push preceding text
        if (mStart > lastIndex) {
          newChildren.push({ type: "text", value: value.slice(lastIndex, mStart) });
        }

        const key = core.toLowerCase();
        const href = terms[key];
        if (href) {
          const linked: Link = {
            type: "link",
            url: href,
            title: null,
            children: [{ type: "text", value: match[0] }],
          };
          newChildren.push(linked);
          totalLinked += 1;
        } else {
          // Fallback: if somehow not in map, keep the raw text
          newChildren.push({ type: "text", value: match[0] });
        }

        lastIndex = mEnd;
      }

      // Trailing text
      if (lastIndex < value.length) {
        newChildren.push({ type: "text", value: value.slice(lastIndex) });
      }

      // Replace the original text node with the new children
      if (newChildren.length) {
        parent.children.splice(index!, 1, ...newChildren);
        return index! + newChildren.length;
      }
    });
  };
};
