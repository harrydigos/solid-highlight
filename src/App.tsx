import { OverlapInput } from "./overlap-inputs/input";
import { OverlapTextarea } from "./overlap-inputs/textarea";

export default function App() {
  return (
    <div class="flex h-screen py-20 flex-col items-center justify-start">
      <div class="flex flex-col gap-6">
        <OverlapInput />
        <OverlapTextarea />
      </div>
    </div>
  );
}
