import { api } from "./api";

export async function chatWithAssistant(message, conversation_history = []) {
  const response = await api.post("/ai-assistant/chat", {
    message,
    conversation_history,
  });

  return response.data;
}