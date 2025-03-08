import { Show, createEffect, createMemo, createSignal } from "solid-js";
import { triggers } from "../constants";
import { parseAdvancedMentions } from "../helpers";
import { List } from "@solid-primitives/list";

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
    <div class="relative w-[400px] h-8 border border-gray-500 rounded-md">
      <input
        value={mentionInputValue()}
        onInput={(e) => setMentionInputValue(e.target.value || "")}
        onScroll={(e) => {
          if (!refInput) return;
          refInput.scrollTop = e.target.scrollTop;
          refInput.scrollLeft = e.target.scrollLeft;
        }}
        placeholder="This is a placeholder!"
        class="absolute inset-0 w-full border-none outline-none text-white/50 px-2 text-base bg-transparent z-[1] placeholder-gray-400"
      />
      <div
        ref={refInput}
        class="absolute inset-0 flex items-center px-2 whitespace-pre overflow-x-auto select-none scrollbar-hidden"
      >
        <List each={derivedMentionInputValue()}>
          {(word) => (
            <Show when={word().isMention} fallback={<span>{word().text}</span>}>
              <span
                class="bg-white rounded-xs cursor-pointer z-[1] text-green-500"
                style={{
                  color: word().color,
                }}
                data-trigger-type={word().triggerName}
              >
                {word().text}
              </span>
            </Show>
          )}
        </List>
      </div>
    </div>
  );
}
