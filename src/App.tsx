import { MentionInput } from "./mention-input";
import { MentionTextarea } from "./mention-textarea";

import "./App.css";

export default function App() {
  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "60px" }}>
      <MentionInput />
      <MentionTextarea />
    </div>
  );
}
