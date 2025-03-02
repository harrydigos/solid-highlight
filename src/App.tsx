import { For, Show, createMemo, createSignal } from "solid-js";
import "./App.css";

const REGEX = /({{.*?}})/g;

export default function App() {
  const [value, setValue] = createSignal("This is a {{ variable }}");
  let ref: HTMLDivElement | undefined;

  const derivedValue = createMemo(() => {
    console.log("v", value(), typeof value(), "v2", value().split(REGEX));
    return value().split(REGEX);
  });

  return (
    <div class="input-container">
      <input
        value={value()}
        onInput={(e) => setValue(e.target.value || "")}
        onScroll={(e) => {
          if (!ref) return;
          ref.scrollTop = e.target.scrollTop;
          ref.scrollLeft = e.target.scrollLeft;
        }}
        placeholder="This is a placeholder!"
      />
      <div ref={ref} class="input-renderer">
        <For each={derivedValue()}>
          {(word) => (
            <Show
              when={word.match(REGEX) !== null}
              fallback={<span>{word}</span>}
            >
              <span class="mention">{word}</span>
            </Show>
          )}
        </For>
      </div>
    </div>
  );
}
