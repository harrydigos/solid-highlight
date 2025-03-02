import { TriggerConfig } from "./types";

export const triggers = [
  { pattern: "@", name: "at-mention", color: "green" },
  { pattern: "##", name: "hash-team-mention", color: "purple" },
  {
    pattern: /\{\{[^}]*\}\}/g,
    name: "curly-mention",
    color: "blue",
  },
] satisfies TriggerConfig[];
