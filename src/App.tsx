import { MentionInput } from "./mention-input";
import { MentionTextarea } from "./mention-textarea";

import "./App.css";

export default function App() {
  return (
    <div class="flex h-screen flex-col items-center justify-center gap-16">
      <MentionInput />
      <MentionTextarea />
    </div>
  );
}
