import {
  Match,
  Switch,
  createEffect,
  createMemo,
  createSignal,
} from "solid-js";
import { parseAdvancedMentions } from "../helpers";
import { triggers } from "../constants";
import { List } from "@solid-primitives/list";

export function MentionTextarea() {
  const [mentionTextAreaValue, setMentionTextAreaValue] = createSignal(
    "Hello @user\nand\n##team!\n\nWe need to update the {{ variable }} here.",
  );
  let refTextArea: HTMLDivElement | undefined;

  const derivedMentionTextAreaValue = createMemo(() => {
    return parseAdvancedMentions(mentionTextAreaValue(), triggers, {
      handleNewlines: true,
    });
  });

  createEffect(() => {
    console.log("textarea", derivedMentionTextAreaValue());
  });

  return (
    <div class="textarea-container">
      <textarea
        value={mentionTextAreaValue()}
        onInput={(e) => {
          setMentionTextAreaValue(e.target.value || "");
        }}
        onScroll={(e) => {
          if (!refTextArea) return;
          refTextArea.scrollTop = e.target.scrollTop;
          refTextArea.scrollLeft = e.target.scrollLeft;
        }}
        placeholder="This is a placeholder!"
      />
      <div ref={refTextArea} class="textarea-renderer">
        <List each={derivedMentionTextAreaValue()}>
          {(word) => (
            <Switch>
              <Match when={word().isNewline}>
                <br />
              </Match>
              <Match when={word().isMention}>
                <span
                  style={{
                    color: word().color || "green",
                    "background-color": "white",
                    "border-radius": "2px",
                    position: "relative",
                    // To move the marker in front
                    cursor: "pointer",
                    "z-index": 1,
                  }}
                  data-trigger-type={word().triggerName}
                >
                  {word().text}
                </span>
              </Match>
              <Match when={!word().isMention}>
                <span>{word().text}</span>
              </Match>
            </Switch>
          )}
        </List>
      </div>
    </div>
  );
}
