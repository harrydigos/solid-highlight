import { Match, Switch, createMemo, createSignal } from "solid-js";
import { parseAdvancedMentions } from "../helpers";
import { triggers } from "../constants";
import { List } from "@solid-primitives/list";

export function OverlapTextarea() {
  const [mentionTextAreaValue, setMentionTextAreaValue] = createSignal(
    "Hello @user1 and ##team!\nWe need to update the {{ variable }} here.\n\nHey @admin, can you check the {{ status }} of this task?\n##urgent ##reminder\n\n@developer, please review the code for {{ feature_name }}.\nWe should also sync with ##design to finalize the UI.\n\nLet me know if anything needs clarification.\nThanks, @manager!",
  );
  let refTextArea: HTMLDivElement | undefined;

  const derivedMentionTextAreaValue = createMemo(() => {
    return parseAdvancedMentions(mentionTextAreaValue(), triggers, {
      handleNewlines: true,
    });
  });

  return (
    <div class="relative w-[400px] min-h-[200px] border border-gray-500 rounded-md">
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
        class="absolute inset-0 text-white/50 w-full h-full border-none outline-none p-2 text-base bg-transparent z-[1] placeholder-gray-400 resize-none whitespace-pre-wrap break-words overflow-x-hidden overflow-y-auto scrollbar-hidden"
      />
      <div
        ref={refTextArea}
        class="absolute inset-0 m-2 whitespace-pre-wrap break-words user-select-none scrollbar-hidden overflow-x-hidden overflow-y-auto"
      >
        <List each={derivedMentionTextAreaValue()}>
          {(word) => (
            <Switch>
              <Match when={word().isNewline}>
                <br />
              </Match>
              <Match when={word().isMention}>
                <span
                  // we need to add 'whitespace-nowrap' because of mentions that have space in between.
                  // so that makes it to not render exactly on top
                  //
                  // Another issue occures when we scroll while hovering the mention
                  class="bg-white relative rounded-xs cursor-pointer z-[1] text-green-500"
                  style={{
                    color: word().color,
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
