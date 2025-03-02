import { For, Show, createMemo, createSignal } from "solid-js";
import "./App.css";

const REGEX = /({{.*?}})/g;

// escape RegExp special characters https://stackoverflow.com/a/9310752/5142490
const escapeRegex = (str: string) =>
  str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

export const makeTriggerRegex = function (
  trigger: RegExp | string,
  options: { allowSpaceInQuery?: boolean } = {},
) {
  if (trigger instanceof RegExp) {
    return trigger;
  } else {
    const { allowSpaceInQuery = false } = options;
    const escapedTriggerChar = escapeRegex(trigger);

    // first capture group is the part to be replaced on completion
    // second capture group is for extracting the search query
    return new RegExp(
      `(?:^|\\s)(${escapedTriggerChar}([^${
        allowSpaceInQuery ? "" : "\\s"
      }${escapedTriggerChar}]*))$`,
    );
  }
};
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
};

type TriggerConfig = {
  pattern: string | RegExp;
  type: "simple" | "regex";
  name: string; // Identifier for this trigger type
  color?: string;
};

function parseAdvancedMentions(
  text: string,
  triggers: TriggerConfig[],
): TextSegment[] {
  if (!text) return [];

  const result: TextSegment[] = [];
  let currentIndex = 0;

  // Process text until we reach the end
  while (currentIndex < text.length) {
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
          let endIndex = text.indexOf(" ", currentIndex + simplePattern.length);
          if (endIndex === -1) endIndex = text.length;

          matchStart = currentIndex;
          matchEnd = endIndex;
          matchedTrigger = trigger;
          mentionFound = true;
          break;
        }
      } else if (trigger.type === "regex") {
        const regexPattern = trigger.pattern as RegExp;
        // We need to create a copy of the regex to ensure lastIndex is set correctly
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
      // If we have accumulated regular text before this mention, add it first
      if (matchStart > currentIndex) {
        // Add the text before the mention, word by word
        const textBefore = text.substring(currentIndex, matchStart);
        const words = textBefore.match(/\S+|\s+/g) || [];
        words.forEach((word) => {
          result.push({ text: word, isMention: false });
        });
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
      // No mention at current position, find the next word boundary
      const nextSpace = text.indexOf(" ", currentIndex);
      if (nextSpace === -1) {
        // No more spaces, add the rest as a word
        result.push({ text: text.substring(currentIndex), isMention: false });
        break;
      } else {
        // Add the word
        result.push({
          text: text.substring(currentIndex, nextSpace + 1),
          isMention: false,
        });
        currentIndex = nextSpace + 1;
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
  // const [trigger, setTrigger] = createSignal<string>("@"); // | RegExp
  const [mentionInputValue, setMentionInputValue] = createSignal(
    "Hello @user and ##team! We need to update the {{ variable }} here.",
    // `This is a ${trigger()}variable`,
  );
  let ref: HTMLDivElement | undefined;

  // const derivedMentionInputValue = createMemo(() => {
  //   // return mentionInputValue().split(REGEX);
  //   // console.log(makeTriggerRegex(mentionInputValue()));
  //   // return makeTriggerRegex(mentionInputValue());
  //   // console.log(mentionInputValue().split(" "));
  //   console.log(parseMentionsWithWrapping(mentionInputValue(), trigger()));
  //   return parseMentionsWithWrapping(mentionInputValue(), trigger());
  //   // return mentionInputValue().split(" ");
  // });

  const derivedMentionInputValue = createMemo(() => {
    console.log(parseAdvancedMentions(mentionInputValue(), triggers));
    return parseAdvancedMentions(mentionInputValue(), triggers);
  });

  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "16px" }}>
      {/* <div> */}
      {/*   <label>Trigger</label> */}
      {/*   <input */}
      {/*     type="text" */}
      {/*     value={trigger()} */}
      {/*     onInput={(e) => setTrigger(e.target.value)} */}
      {/*   /> */}
      {/* </div> */}
      <input
        class="input-normal"
        readonly
        value={mentionInputValue()}
        placeholder="This is a placeholder!"
      />

      <div class="input-container">
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
                    // cursor: "pointer",
                    // "z-index": 1,
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
    </div>
  );
}
