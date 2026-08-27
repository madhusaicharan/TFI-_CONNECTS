import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from '../../hooks/useChatbot';
import { Sparkles, MessageSquare, X, Send, Trash2, Bot, User, Film } from 'lucide-react';
import './ChatWidget.css';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const { messages, loading, sendMessage, clearChat } = useChatbot();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of messages list on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;
    sendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="ai-chat-widget-wrapper">
      {/* Floating Trigger Toggle Button */}
      {!isOpen && (
        <button
          className="ai-chat-trigger-btn fade-in"
          onClick={() => setIsOpen(true)}
          title="Open AI Movie Discovery Assistant"
        >
          <Sparkles className="sparkle-icon" size={18} />
          <span>Try AI Search</span>
          <span className="live-dot"></span>
        </button>
      )}

      {/* Floating Glassmorphic Chat Popup Window */}
      {isOpen && (
        <div className="ai-chat-popup glass-panel slide-up">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-header-title">
              <div className="bot-avatar-badge">
                <Bot size={18} color="#ffffff" />
              </div>
              <div>
                <h3 className="ai-chat-heading">TFI_CONNECTS AI Assistant</h3>
                <span className="ai-chat-sub">Zero-Hallucination RAG Movie Search</span>
              </div>
            </div>

            <div className="ai-chat-header-actions">
              <button
                className="header-icon-btn"
                onClick={clearChat}
                title="Clear Conversation"
              >
                <Trash2 size={16} />
              </button>
              <button
                className="header-icon-btn close-btn"
                onClick={() => setIsOpen(false)}
                title="Close Chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="ai-chat-messages-body">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble-row ${msg.role === 'user' ? 'user-row' : 'assistant-row'}`}
              >
                <div className={`chat-avatar ${msg.role}`}>
                  {msg.role === 'user' ? <User size={14} /> : <Film size={14} />}
                </div>

                <div className={`chat-bubble ${msg.role} ${msg.isError ? 'error-bubble' : ''}`}>
                  <div className="chat-content">
                    {msg.content.split('\n').map((line, idx) => (
                      <React.Fragment key={idx}>
                        {line}
                        {idx < msg.content.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>

                  {msg.timestamp && (
                    <span className="chat-timestamp">{msg.timestamp}</span>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="chat-bubble-row assistant-row">
                <div className="chat-avatar assistant">
                  <Bot size={14} />
                </div>
                <div className="chat-bubble assistant typing-bubble">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          {messages.length <= 2 && !loading && (
            <div className="quick-suggestions-bar">
              <button
                className="suggestion-chip"
                onClick={() => sendMessage('Top rated mass action movies')}
              >
                🔥 Mass Action
              </button>
              <button
                className="suggestion-chip"
                onClick={() => sendMessage('Best romantic Telugu movies')}
              >
                ❤️ Romance
              </button>
              <button
                className="suggestion-chip"
                onClick={() => sendMessage('Mind-bending thriller movies')}
              >
                🕵️ Thrillers
              </button>
            </div>
          )}

          {/* Footer Input Bar */}
          <form className="ai-chat-input-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="ai-chat-input"
              placeholder="Ask AI for movie recommendations..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="ai-chat-send-btn"
              disabled={!inputText.trim() || loading}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
