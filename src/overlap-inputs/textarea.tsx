import { Match, Switch, createMemo, createSignal } from 'solid-js';
import { parseAdvancedMentions } from '../helpers';
import { triggers } from '../constants';
import { List } from '@solid-primitives/list';

export function OverlapTextarea() {
  const [mentionTextAreaValue, setMentionTextAreaValue] = createSignal(
    'Hello @user1 and ##team!\nWe need to update the {{ variable }} here.\n\nHey @admin, can you check the {{ status }} of this task?\n##urgent ##reminder\n\n@developer, please review the code for {{ feature_name }}.\nWe should also sync with ##design to finalize the UI.\n\nLet me know if anything needs clarification.\nThanks, @manager!',
  );
  let refTextArea: HTMLDivElement | undefined;

  const derivedMentionTextAreaValue = createMemo(() => {
    return parseAdvancedMentions(mentionTextAreaValue(), triggers, {
      handleNewlines: true,
    });
  });

  return (
    <div class="relative min-h-[200px] w-[400px] rounded-md border border-gray-500">
      <textarea
        value={mentionTextAreaValue()}
        onInput={(e) => {
          setMentionTextAreaValue(e.target.value || '');
        }}
        onScroll={(e) => {
          if (!refTextArea) return;
          refTextArea.scrollTop = e.target.scrollTop;
          refTextArea.scrollLeft = e.target.scrollLeft;
        }}
        placeholder="This is a placeholder!"
        class="scrollbar-hidden absolute inset-0 z-[1] h-full w-full resize-none overflow-x-hidden overflow-y-auto border-none bg-transparent p-2 text-base break-words whitespace-pre-wrap text-transparent placeholder-gray-400 outline-none"
      />
      <div
        ref={refTextArea}
        class="user-select-none scrollbar-hidden absolute inset-0 m-2 overflow-x-hidden overflow-y-auto break-words whitespace-pre-wrap"
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
                  class="relative rounded-xs bg-white text-green-500"
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
