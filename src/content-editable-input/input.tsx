import { createEffect, createMemo, createSignal, For, JSX, onCleanup, Show } from 'solid-js';

export function ContentEditableInput() {
  const placeholder = 'Type something...';
  const autoFocus = false;
  const disabled = false;
  const maxLength = 500;

  const [isFocused, setIsFocused] = createSignal(false);
  const [mentionInputValue, setMentionInputValue] = createSignal(
    'Hello @user and ##team!', // We need to update the {{ variable }} here.",
  );

  let editorRef: HTMLDivElement | undefined;

  // Update the content when value prop changes
  // createEffect(() => {
  //   if (editorRef && editorRef.textContent !== value) {
  //     editorRef.textContent = value;
  //   }
  // }, [value]);

  // createEffect(() => {
  //   if (editorRef && editorRef.textContent !== mentionInputValue()) {
  //     editorRef.textContent = mentionInputValue();
  //   }
  // });

  // Apply autofocus if needed
  // createEffect(() => {
  //   if (autoFocus && editorRef) {
  //     editorRef.focus();
  //     // Place cursor at end
  //     const range = document.createRange();
  //     const selection = window.getSelection();
  //     range.selectNodeContents(editorRef);
  //     range.collapse(false);
  //     selection?.removeAllRanges();
  //     selection?.addRange(range);
  //   }
  // }, [autoFocus]);

  // const handleInput: JSX.InputEventHandlerUnion<HTMLDivElement, InputEvent> = (e) => {
  //   // if (onChange) {
  //   const text = e.target.textContent || '';
  //   console.log({ text });
  //
  //   // Handle maxLength similar to input element
  //   if (maxLength && text.length > maxLength) {
  //     e.target.textContent = text.substring(0, maxLength);
  //
  //     // Reset cursor position after truncation
  //     const selection = window.getSelection();
  //     const range = document.createRange();
  //     range.setStart(e.target.childNodes[0], maxLength);
  //     range.setEnd(e.target.childNodes[0], maxLength);
  //     selection?.removeAllRanges();
  //     selection?.addRange(range);
  //   }
  //
  //   // setMentionInputValue(e.target.textContent || "");
  //   // onChange({ target: { value: e.target.textContent, name } });
  //   // }
  // };

  // const handlePaste = (e: ClipboardEvent) => {
  //   e.preventDefault();
  //
  //   // Get plain text from clipboard
  //   const text = e?.clipboardData?.getData('text/plain');
  //
  //   console.log({ text });
  //
  //   // Insert at cursor position
  //   document.execCommand('insertText', false, text);
  // };

  // const derivedMentionInputValue = createMemo(() => {
  //   return parseAdvancedMentions(mentionInputValue(), triggers, {
  //     handleNewlines: false,
  //   });
  // });

  // createEffect(() => {
  //   console.log(derivedMentionInputValue());
  // });

  function findMentionsAndReplace(text: string, callback: (mention: string) => string): string {
    // const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    // return text.replace(mentionRegex, (_, mention) => callback(`@${mention}`));

    return text.replace('@john', () => callback(`@john`));
  }

  const [mentions, setMentions] = createSignal<Array<{ id: string; value: string }>>([]);

  return (
    <div class="h-fit min-h-8 w-[400px] rounded-md border border-gray-500 bg-white px-2 py-1 text-base text-gray-700 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none">
      <div>
        {/* <Show when={!isFocused() && (!editorRef || !editorRef?.textContent)}> */}
        {/*   <div aria-hidden="true">{placeholder}</div> */}
        {/* </Show> */}

        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="false"
          // spellCheck="true"
          // autoCorrect="off"
          aria-haspopup="listbox"
          aria-invalid="false"
          aria-autocomplete="list"
          // aria-label={"ariaLabel" || placeholder}
          contentEditable={!disabled}
          style={{
            position: 'relative',
            outline: 'none',
            // 'white-space': 'pre-wrap',
            // 'overflow-wrap': 'break-word',
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onClick={(event) => {
            if (!event.target.matches('span[role="button"]')) {
              return;
            }

            console.log('clicked mention', event.target);
            event.preventDefault();
          }}
          onBeforeInput={(e) => {
            // console.log('onInput', e, {
            //   textContent: e.target.textContent,
            //   innerHTML: e.target.innerHTML,
            //   innerText: e.target.innerText,
            // });
            if (editorRef) {
              // editorRef.innerHTML = e.target.textContent || '';
              editorRef.innerHTML = findMentionsAndReplace(
                (e.target as any)?.innerText || '',
                (mention) => {
                  const curr = mentions().find((m) => m.value.includes(m.id));
                  if (curr) {
                    return curr.value;
                  }
                  const id = Date.now() + '';
                  const content = `<span
                    id="${id}"
                    contenteditable="false"
                    aria-label="${mention}"
                    role="button"
                    tabIndex="0"
                    class="cursor-pointer rounded-xs bg-gray-100 text-green-500 hover:bg-gray-200"
                  >${mention}</span>`;

                  setMentions((prev) => [...prev, { id, value: content }]);
                  return content;
                },
              );

              const range = document.createRange();
              const selection = window.getSelection();
              range.selectNodeContents(editorRef);
              range.collapse(false); // Collapse to the end (last character)
              selection?.removeAllRanges();
              selection?.addRange(range);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          // onPaste={handlePaste}
        >
          {/* <For each={derivedMentionInputValue()}> */}
          {/*   {(word) => ( */}
          {/*     <Show when={word.isMention} fallback={<span>{word.text}</span>}> */}
          {/*       <Mention value={word.text} /> */}
          {/*     </Show> */}
          {/*   )} */}
          {/* </For> */}
        </div>
      </div>
    </div>
  );
}
