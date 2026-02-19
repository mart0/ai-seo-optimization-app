'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useUser } from '@auth0/nextjs-auth0/client';
import {
  GET_CONVERSATIONS,
  GET_CONVERSATION,
  SEND_MESSAGE,
  DELETE_CONVERSATION,
} from '@/lib/graphql/queries';
import { RETRY_INSTRUCTION } from '@/constants/chat';
import { Sidebar } from './Sidebar';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

type Message = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
};

export function ChatInterface() {
  const { user } = useUser();
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversationsData, refetch: refetchConversations } =
    useQuery(GET_CONVERSATIONS);

  const { data: conversationData } = useQuery(GET_CONVERSATION, {
    variables: { id: activeConversationId },
    skip: !activeConversationId,
  });

  const [sendMessageMutation] = useMutation(SEND_MESSAGE);
  const [deleteConversationMutation] = useMutation(DELETE_CONVERSATION);

  const conversations: Conversation[] =
    conversationsData?.conversations ?? [];
  const activeConversation: Conversation | null =
    conversationData?.conversation ?? null;
  const messages: Message[] = activeConversation?.messages ?? [];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSendMessage(content: string, model?: string) {
    if (isSending) return;
    setIsSending(true);

    try {
      const { data } = await sendMessageMutation({
        variables: {
          input: {
            content,
            conversationId: activeConversationId ?? undefined,
            model: model ?? undefined,
          },
        },
      });

      if (data?.sendMessage) {
        const newConversationId = data.sendMessage.conversation.id;

        if (!activeConversationId) {
          setActiveConversationId(newConversationId);
        }

        await refetchConversations();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }

  async function handleDeleteConversation(id: string) {
    try {
      await deleteConversationMutation({ variables: { id } });

      if (activeConversationId === id) {
        setActiveConversationId(null);
      }

      await refetchConversations();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }

  function handleNewChat() {
    setActiveConversationId(null);
  }

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        isOpen={sidebarOpen}
        onSelect={setActiveConversationId}
        onDelete={handleDeleteConversation}
        onNewChat={handleNewChat}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 hover:text-gray-700 lg:hidden"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h2 className="text-sm font-medium text-gray-700 truncate">
              {activeConversation?.title ?? 'New Chat'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {user?.picture && (
              <img
                src={user.picture}
                alt=""
                className="w-7 h-7 rounded-full"
              />
            )}
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user?.name}
            </span>
            <a
              href="/api/auth/logout"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Log out
            </a>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 && !isSending ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  SEO Assistant
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Paste a URL to get an SEO analysis, or ask any SEO-related
                  question.
                </p>
                <div className="space-y-2">
                  {[
                    'Analyze https://example.com',
                    'What makes a good title tag?',
                    'How do I improve my meta descriptions?',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSendMessage(suggestion)}
                      className="block w-full text-left text-sm px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, i) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  onRetry={
                    msg.role === 'assistant' && i > 0
                      ? () => {
                          const prevUserContent = messages[i - 1].content;
                          handleSendMessage(prevUserContent + RETRY_INSTRUCTION);
                        }
                      : undefined
                  }
                />
              ))}
              {isSending && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <svg
                      className="w-4 h-4 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.15s' }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.3s' }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-200 bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput onSend={handleSendMessage} disabled={isSending} />
          </div>
        </div>
      </div>
    </div>
  );
}
