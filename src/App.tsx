import { OverlapInput } from "./overlap-inputs/input";
import { OverlapTextarea } from "./overlap-inputs/textarea";

export default function App() {
  return (
    <div class="flex h-screen py-20 flex-col items-center justify-start">
      <div class="flex flex-col gap-6 max-w-[400px]">
        <div>
          <h2>Text overlay</h2>
          <p class="text-xs text-gray-300">
            This example places words over an input or textarea, with the
            original text faded to show alignment.
          </p>
        </div>
        <OverlapInput />
        <OverlapTextarea />
      </div>
    </div>
  );
}
