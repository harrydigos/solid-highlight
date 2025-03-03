import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { triggers } from "../constants";
import { parseAdvancedMentions } from "../helpers";

export function MentionInput() {
  const [mentionInputValue, setMentionInputValue] = createSignal(
    "Hello @user and ##team! We need to update the {{ variable }} here.",
  );
  let refInput: HTMLDivElement | undefined;

  const derivedMentionInputValue = createMemo(() => {
    return parseAdvancedMentions(mentionInputValue(), triggers, {
      handleNewlines: false,
    });
  });

  createEffect(() => {
    console.log("input", derivedMentionInputValue());
  });

  return (
    <div class="input-container">
      <input
        value={mentionInputValue()}
        onInput={(e) => setMentionInputValue(e.target.value || "")}
        onScroll={(e) => {
          if (!refInput) return;
          refInput.scrollTop = e.target.scrollTop;
          refInput.scrollLeft = e.target.scrollLeft;
        }}
        placeholder="This is a placeholder!"
      />
      <div ref={refInput} class="input-renderer">
        <For each={derivedMentionInputValue()}>
          {(word) => (
            <Show when={word.isMention} fallback={<span>{word.text}</span>}>
              <span
                style={{
                  color: word.color || "green",
                  "background-color": "white",
                  "border-radius": "2px",
                  // To move the marker in front
                  cursor: "pointer",
                  "z-index": 1,
                }}
                data-trigger-type={word.triggerName}
              >
                {word.text}
              </span>
            </Show>
          )}
        </For>
      </div>
    </div>
  );
}
