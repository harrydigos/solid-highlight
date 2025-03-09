import { Show, createMemo, createSignal } from 'solid-js';
import { triggers } from '../constants';
import { parseAdvancedMentions } from '../helpers';
import { List } from '@solid-primitives/list';

export function OverlapInput() {
  const [mentionInputValue, setMentionInputValue] = createSignal(
    'Hello @user and ##team! We need to update the {{ variable }} here.',
  );
  let refInput: HTMLDivElement | undefined;

  const derivedMentionInputValue = createMemo(() => {
    return parseAdvancedMentions(mentionInputValue(), triggers, {
      handleNewlines: false,
    });
  });

  return (
    <div class="relative h-8 w-[400px] rounded-md border border-gray-500">
      <input
        value={mentionInputValue()}
        onInput={(e) => setMentionInputValue(e.target.value || '')}
        onScroll={(e) => {
          if (!refInput) return;
          refInput.scrollTop = e.target.scrollTop;
          refInput.scrollLeft = e.target.scrollLeft;
        }}
        placeholder="This is a placeholder!"
        class="absolute inset-0 z-[1] w-full border-none bg-transparent px-2 text-base text-white/50 placeholder-gray-400 outline-none"
      />
      <div
        ref={refInput}
        class="scrollbar-hidden absolute inset-0 flex items-center overflow-x-auto px-2 whitespace-pre select-none"
      >
        <List each={derivedMentionInputValue()}>
          {(word) => (
            <Show when={word().isMention} fallback={<span>{word().text}</span>}>
              <span
                class="z-[1] cursor-pointer rounded-xs bg-white text-green-500"
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
