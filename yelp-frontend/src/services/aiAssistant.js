import { api } from "./api";

export async function chatWithAssistant(message, conversation_history = []) {
  try {
    const response = await api.post("/ai-assistant/chat", {
      message,
      conversation_history,
    });

    return response.data; 
  } catch (error) {
    console.error("AI Assistant error:", error?.response?.data || error.message);
    throw error;
  }
}