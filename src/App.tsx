import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  onMount,
} from "solid-js";
import "./App.css";

// {
//   /**
//    * If set to `true` a regular text input element will be rendered
//    * instead of a textarea
//    */
//   singleLine: PropTypes.bool,
//   allowSpaceInQuery: PropTypes.bool,
//   allowSuggestionsAboveCursor: PropTypes.bool,
//   forceSuggestionsAboveCursor: PropTypes.bool,
//   ignoreAccents: PropTypes.bool,
//   a11ySuggestionsListLabel: PropTypes.string,
//
//   value: PropTypes.string,
//   onKeyDown: PropTypes.func,
//   customSuggestionsContainer: PropTypes.func,
//   onSelect: PropTypes.func,
//   onBlur: PropTypes.func,
//   onChange: PropTypes.func,
//   suggestionsPortalHost:
//     typeof Element === "undefined"
//       ? PropTypes.any
//       : PropTypes.PropTypes.instanceOf(Element),
//   inputRef: PropTypes.oneOfType([
//     PropTypes.func,
//     PropTypes.shape({
//       current:
//         typeof Element === "undefined"
//           ? PropTypes.any
//           : PropTypes.instanceOf(Element),
//     }),
//   ]),
//   inputComponent: PropTypes.oneOfType([PropTypes.func, PropTypes.elementType]),
//
//   children: PropTypes.oneOfType([
//     PropTypes.element,
//     PropTypes.arrayOf(PropTypes.element),
//   ]).isRequired,
// }

type TextSegment = {
  text: string;
  isMention: boolean;
  triggerType?: string; // To identify which trigger was used
  color?: string;
  isNewline?: boolean;
};

type TriggerConfig = {
  pattern: string | RegExp;
  type: "simple" | "regex";
  name: string; // Identifier for this trigger type
  color?: string;
};

type ParserOptions = {
  handleNewlines?: boolean;
};

function parseAdvancedMentions(
  text: string,
  triggers: TriggerConfig[],
  options: ParserOptions = { handleNewlines: false },
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
      if (trigger.type === "simple") {
        const simplePattern = trigger.pattern as string;

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
      } else if (trigger.type === "regex") {
        const regexPattern = trigger.pattern as RegExp;
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
        triggerType: matchedTrigger.name,
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

// Example usage:
/*
const triggers = [
  { pattern: '@', type: 'simple', name: 'at-mention' },
  { pattern: '@@', type: 'simple', name: 'double-at-mention' },
  { pattern: /\{\{[^}]+\}\}/g, type: 'regex', name: 'curly-mention' }
];

const text = "Hello @user and @@team! We need to update the {{variable}} here.";
const segments = parseAdvancedMentions(text, triggers);
const container = document.getElementById('text-container');
renderAdvancedTextWithMentions(segments).forEach(span => container.appendChild(span));
*/

const triggers = [
  { pattern: "@", type: "simple", name: "at-mention", color: "green" },
  { pattern: "##", type: "simple", name: "hash-team-mention", color: "purple" },
  // Updated regex to capture {{ with any content including spaces inside }}
  {
    pattern: /\{\{[^}]*\}\}/g,
    type: "regex",
    name: "curly-mention",
    color: "blue",
  },
] satisfies TriggerConfig[];

export default function App() {
  const [mentionInputValue, setMentionInputValue] = createSignal(
    "Hello @user and ##team! We need to update the {{ variable }} here.",
    // `This is a ${trigger()}variable`,
  );

  const [mentionTextAreaValue, setMentionTextAreaValue] = createSignal(
    "Hello @user\nand\n##team!\n\nWe need to update the {{ variable }} here.",
  );
  let ref: HTMLDivElement | undefined;

  createEffect(() => {
    console.log(
      parseAdvancedMentions(mentionInputValue(), triggers, {
        handleNewlines: false,
      }),
    );
  });
  const derivedMentionInputValue = createMemo(() => {
    // console.log(parseAdvancedMentions(mentionInputValue(), triggers));
    return parseAdvancedMentions(mentionInputValue(), triggers, {
      handleNewlines: false,
    });
  });

  createEffect(() => {
    console.log(
      parseAdvancedMentions(mentionTextAreaValue(), triggers, {
        handleNewlines: true,
      }),
    );
  });

  const derivedMentionTextAreaValue = createMemo(() => {
    return parseAdvancedMentions(mentionTextAreaValue(), triggers, {
      handleNewlines: true,
    });
  });

  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "60px" }}>
      <div style={{ display: "flex", "flex-direction": "column", gap: "16px" }}>
        <div class="input-container">
          {/* FIX: overflow here broke */}
          <input
            value={mentionInputValue()}
            onInput={(e) => setMentionInputValue(e.target.value || "")}
            onScroll={(e) => {
              if (!ref) return;
              ref.scrollTop = e.target.scrollTop;
              ref.scrollLeft = e.target.scrollLeft;
            }}
            placeholder="This is a placeholder!"
          />

          <div ref={ref} class="input-renderer">
            <For each={derivedMentionInputValue()}>
              {(word) => (
                <Show
                  // when={word.match(REGEX) !== null}
                  when={word.isMention}
                  fallback={<span>{word.text}</span>}
                >
                  <span
                    style={{
                      color: word.color || "green",
                      "background-color": "white",
                      "border-radius": "2px",
                      // To move the marker in front
                      cursor: "pointer",
                      "z-index": 1,
                    }}
                    data-trigger-type={word.triggerType}
                  >
                    {word.text}
                  </span>
                </Show>
              )}
            </For>
          </div>
        </div>
        <div style={{ display: "flex", "flex-direction": "column" }}>
          <label>actual input value</label>
          <input
            class="input-normal"
            readonly
            value={mentionInputValue()}
            placeholder="This is a placeholder!"
          />
        </div>
      </div>

      <div style={{ display: "flex", "flex-direction": "column", gap: "16px" }}>
        <div class="textarea-container">
          <textarea
            value={mentionTextAreaValue()}
            onInput={(e) => {
              console.log(e.target.value);
              setMentionTextAreaValue(e.target.value || "");
            }}
            onScroll={(e) => {
              if (!ref) return;
              ref.scrollTop = e.target.scrollTop;
              ref.scrollLeft = e.target.scrollLeft;
            }}
            placeholder="This is a placeholder!"
          />
          <div ref={ref} class="textarea-renderer">
            <For each={derivedMentionTextAreaValue()}>
              {(word) => (
                <Switch>
                  <Match when={word.isNewline}>
                    {/* <span */}
                    {/*   style={{ */}
                    {/*     height: "fit-content", */}
                    {/*     "background-color": "red", */}
                    {/*     color: "green", */}
                    {/*     // display: "flex", */}
                    {/*     // flex: 1, */}
                    {/*     // width: "100%", */}
                    {/*     // "flex-direction": "row", */}
                    {/*     // display: "inline-flex", */}
                    {/*     // flex: "0 0 100%", */}
                    {/*     // flex: 1, */}
                    {/*     // "flex-wrap": "nowrap", */}
                    {/*     // "white-space": "nowrap", */}
                    {/*   }} */}
                    {/* > */}
                    {/*   {"{{ 1 }}"} */}
                    {/* </span> */}
                    <br />
                  </Match>
                  <Match when={word.isMention}>
                    <span
                      class="mention"
                      style={{
                        // color: word.color || "green",
                        // height: "fit-content",
                        // "z-index": 1,
                        // cursor: "pointer",
                        // display: "inline-flex",
                        // flex: 0,
                        // "min-width": "fit-content",

                        color: word.color || "green",
                        "background-color": "white",
                        "border-radius": "2px",
                        position: "relative",
                        // To move the marker in front
                        cursor: "pointer",
                        "z-index": 1,
                      }}
                      data-trigger-type={word.triggerType}
                    >
                      {word.text}
                    </span>
                  </Match>
                  <Match when={!word.isMention}>
                    <span
                      style={
                        {
                          // display: "flex",
                          // flex: 0,
                          // "min-width": "fit-content",
                        }
                      }
                    >
                      {word.text}
                    </span>
                  </Match>
                </Switch>
              )}
            </For>
          </div>
        </div>

        <div style={{ display: "flex", "flex-direction": "column" }}>
          <label>actual textarea value</label>
          <textarea
            class="textarea-normal"
            readonly
            value={mentionTextAreaValue()}
            placeholder="This is a placeholder!"
          />
        </div>
      </div>
    </div>
  );
}
