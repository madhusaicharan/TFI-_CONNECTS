import { useState, useCallback } from 'react';
import { sendChatMessage } from '../services/api';

/**
 * Custom hook for AI Chatbot state and conversation management
 */
export const useChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 Hi! I am your TFI_CONNECTS AI Cinema Assistant. Ask me to recommend Telugu movies by genre, mood, hero, or plot keywords!'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (userText) => {
    if (!userText || userText.trim() === '' || loading) return;

    const trimmedText = userText.trim();
    const userMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmedText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    // Prepare running conversation history (last 6 messages)
    const historyPayload = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const data = await sendChatMessage(trimmedText, historyPayload);

      const assistantMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'I found some top recommendations from our TFI_CONNECTS catalog!',
        source: data.source,
        retrievedCount: data.retrievedCount,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('[useChatbot] Error:', err.message);
      setError(err.message || 'Unable to connect to AI Search.');

      const errorMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        isError: true,
        content: '⚠️ Sorry, an error occurred while connecting to AI Search. Please try asking again in a moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: '👋 Hi! I am your TFI_CONNECTS AI Cinema Assistant. Ask me to recommend Telugu movies by genre, mood, hero, or plot keywords!'
      }
    ]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearChat
  };
};
