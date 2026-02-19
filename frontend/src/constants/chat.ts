/** Appended to the user message on retry; sent to the AI but hidden in the UI. */
export const RETRY_INSTRUCTION =
  '\n\n[Please improve your previous answer: make it better and more informative.]';

export function stripRetryInstruction(content: string): string {
  return content.replace(RETRY_INSTRUCTION, '').trim();
}
