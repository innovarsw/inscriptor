export const promptTabId = 1;
export const chatTabId = 2;
export const agentChatTabId = 3;

export function getPromptTabId(promptType) {
  if(promptType === 'chat') {
    return chatTabId;
  }
  return promptTabId;
}
