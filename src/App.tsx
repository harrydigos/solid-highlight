import { ContentEditableInput } from './content-editable-input/input';
import { OverlapInput } from './overlap-inputs/input';
import { OverlapTextarea } from './overlap-inputs/textarea';

export default function App() {
  return (
    <div class="flex h-screen flex-col items-center justify-start gap-24 py-20">
      <div class="flex max-w-[400px] flex-col gap-6">
        <div>
          <h2>Text overlay</h2>
          <p class="text-xs text-gray-300">
            This example places words over an input or textarea, with the original text faded to
            show alignment.
          </p>
        </div>
        <OverlapInput />
        <OverlapTextarea />
      </div>

      <div class="flex max-w-[400px] flex-col gap-6">
        <div>
          <h2>Content editable</h2>
          <p class="text-xs text-gray-300">
            This example replaces the textarea and input and uses a{' '}
            <span class="rounded-xs bg-gray-800 p-0.5">contenteditable</span> div.
          </p>
        </div>
        <ContentEditableInput />
      </div>
    </div>
  );
}
