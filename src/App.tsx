import { MentionInput } from "./mention-input";
import { MentionTextarea } from "./mention-textarea";

export default function App() {
  return (
    <div class="flex h-screen flex-col items-center justify-center gap-16">
      <MentionInput />
      <MentionTextarea />
    </div>
  );
}
