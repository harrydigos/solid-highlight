import type { TextSegment, TriggerConfig } from "./types";

export function parseAdvancedMentions(
  text: string,
  triggers: TriggerConfig[],
  options = { handleNewlines: false },
): TextSegment[] {
  if (!text) return [];

  const result: TextSegment[] = [];
  let currentIndex = 0;

  // Process text until we reach the end
  while (currentIndex < text.length) {
    // Check for newlines first if handling them
    if (
      options.handleNewlines &&
      text.substring(currentIndex, currentIndex + 1) === "\n"
    ) {
      result.push({
        text: "\n",
        isMention: false,
        isNewline: true,
      });
      currentIndex++;
      continue;
    }

    let mentionFound = false;
    let matchedTrigger: TriggerConfig | null = null;
    let matchStart = currentIndex;
    let matchEnd = currentIndex;

    // Try to match each trigger at the current position
    for (const trigger of triggers) {
      if (typeof trigger.pattern === "string") {
        const simplePattern = trigger.pattern;

        // Check if text at current position starts with this trigger
        if (text.startsWith(simplePattern, currentIndex)) {
          // Find the end of the mention (space or newline)
          let endIndex = -1;
          for (
            let i = currentIndex + simplePattern.length;
            i < text.length;
            i++
          ) {
            if (text[i] === " " || text[i] === "\n") {
              endIndex = i;
              break;
            }
          }
          if (endIndex === -1) endIndex = text.length;

          matchStart = currentIndex;
          matchEnd = endIndex;
          matchedTrigger = trigger;
          mentionFound = true;
          break;
        }
      } else if (trigger.pattern instanceof RegExp) {
        const regexPattern = trigger.pattern;
        // Create a copy of the regex to ensure lastIndex is set correctly
        const regex = new RegExp(regexPattern.source, regexPattern.flags);
        regex.lastIndex = currentIndex;

        const match = regex.exec(text);
        if (match && match.index === currentIndex) {
          matchStart = currentIndex;
          matchEnd = currentIndex + match[0].length;
          matchedTrigger = trigger;
          mentionFound = true;
          break;
        }
      } else {
        throw new Error("Unsupported pattern");
      }
    }

    if (mentionFound && matchedTrigger) {
      // If we have accumulated regular text before this mention, add it
      if (matchStart > currentIndex) {
        // Process the text before the mention
        let textBefore = text.substring(currentIndex, matchStart);

        if (options.handleNewlines) {
          // Split by newlines first
          const segments = textBefore.split(/(\n)/);

          segments.forEach((segment) => {
            if (segment === "\n") {
              result.push({ text: "\n", isMention: false, isNewline: true });
            } else if (segment) {
              // Split regular text by word boundaries
              const words = segment.match(/\S+|\s+/g) || [];
              words.forEach((word) => {
                result.push({ text: word, isMention: false });
              });
            }
          });
        } else {
          // Original word-by-word splitting
          const words = textBefore.match(/\S+|\s+/g) || [];
          words.forEach((word) => {
            result.push({ text: word, isMention: false });
          });
        }
      }

      // Add the mention as a single unit
      const mentionText = text.substring(matchStart, matchEnd);
      result.push({
        text: mentionText,
        isMention: true,
        triggerName: matchedTrigger.name,
        color: matchedTrigger.color,
      });

      // Move current index past this mention
      currentIndex = matchEnd;
    } else {
      // No mention at current position, find the next word boundary or newline
      let nextSpaceIndex = text.indexOf(" ", currentIndex);
      let nextNewlineIndex = options.handleNewlines
        ? text.indexOf("\n", currentIndex)
        : -1;

      // Determine which comes first: space or newline
      let nextBreakIndex = -1;
      if (nextSpaceIndex !== -1 && nextNewlineIndex !== -1) {
        nextBreakIndex = Math.min(nextSpaceIndex, nextNewlineIndex);
      } else if (nextSpaceIndex !== -1) {
        nextBreakIndex = nextSpaceIndex;
      } else if (nextNewlineIndex !== -1) {
        nextBreakIndex = nextNewlineIndex;
      }

      if (nextBreakIndex === -1) {
        // No more breaks, add the rest as a word
        result.push({ text: text.substring(currentIndex), isMention: false });
        break;
      } else {
        // Check if the break is a newline
        if (options.handleNewlines && text[nextBreakIndex] === "\n") {
          // Add text before newline
          if (nextBreakIndex > currentIndex) {
            result.push({
              text: text.substring(currentIndex, nextBreakIndex),
              isMention: false,
            });
          }
          // Add the newline
          result.push({ text: "\n", isMention: false, isNewline: true });
          currentIndex = nextBreakIndex + 1;
        } else {
          // Regular space break
          result.push({
            text: text.substring(currentIndex, nextBreakIndex + 1),
            isMention: false,
          });
          currentIndex = nextBreakIndex + 1;
        }
      }
    }
  }

  return result;
}
