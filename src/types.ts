export type TextSegment = {
  text: string;
  isMention: boolean;
  triggerName?: string; // To identify which trigger was used
  color?: string;
  isNewline?: boolean;
};

export type TriggerConfig = {
  name: string; // Identifier for this trigger type
  pattern: string | RegExp;
  color?: string;
};
