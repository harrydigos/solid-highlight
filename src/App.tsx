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
};

function parseMentionsWithWrapping(text: string, trigger = "@"): TextSegment[] {
  if (!text) return [];

  const result: TextSegment[] = [];
  let currentText = "";
  let inMention = false;

  // Helper function to add a segment to our result
  const addSegment = (text: string, isMention: boolean) => {
    if (!text) return;

    // If not a mention, split by word boundaries for better wrapping
    if (!isMention) {
      // Match words, spaces, and punctuation separately
      const parts = text.match(/\S+|\s+/g) || [];
      parts.forEach((part) => {
        result.push({ text: part, isMention: false });
      });
    } else {
      // Keep mentions as a single unit
      result.push({ text, isMention: true });
    }
  };

  for (let i = 0; i < text.length; i++) {
    // Check if current character is a trigger
    if (text[i] === trigger[0] && !inMention) {
      // Add any accumulated regular text
      addSegment(currentText, false);
      currentText = trigger;
      inMention = true;
    } else if (inMention && /\s/.test(text[i])) {
      // End mention when we hit whitespace
      addSegment(currentText, true);
      currentText = text[i];
      inMention = false;
    } else {
      currentText += text[i];
    }
  }

  // Add the final segment
  if (inMention) {
    addSegment(currentText, true);
  } else {
    addSegment(currentText, false);
  }

  return result;
}

export default function App() {
  const [trigger, setTrigger] = createSignal<string>("@"); // | RegExp
  const [mentionInputValue, setMentionInputValue] = createSignal(
    `This is a ${trigger()}variable`,
  );
  let ref: HTMLDivElement | undefined;

  const derivedMentionInputValue = createMemo(() => {
    // return mentionInputValue().split(REGEX);
    // console.log(makeTriggerRegex(mentionInputValue()));
    // return makeTriggerRegex(mentionInputValue());
    // console.log(mentionInputValue().split(" "));
    console.log(parseMentionsWithWrapping(mentionInputValue(), trigger()));
    return parseMentionsWithWrapping(mentionInputValue(), trigger());
    // return mentionInputValue().split(" ");
  });

  return (
    <>
      <div>
        <label>Trigger</label>
        <input
          type="text"
          value={trigger()}
          onInput={(e) => setTrigger(e.target.value)}
        />
      </div>
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
                <span class="mention">{word.text}</span>
              </Show>
            )}
          </For>
        </div>
      </div>
    </>
  );
}
