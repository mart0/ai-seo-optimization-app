'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { stripRetryInstruction } from '@/constants/chat';

type ChatMessageProps = {
  role: string;
  content: string;
  onRetry?: () => void;
};

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ThumbUpIcon({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function ThumbDownIcon({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
      <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.56" />
    </svg>
  );
}

export function ChatMessage({ role, content, onRetry }: ChatMessageProps) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);

  function handleCopy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (isUser) {
    const displayContent = stripRetryInstruction(content);
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 group">
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
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
      <div className="max-w-[85%] flex flex-col gap-1.5">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-li:text-gray-700 prose-table:text-gray-700 [&_h2[data-section=comment]+p]:text-sm [&_h2[data-section=comment]+p]:leading-snug [&_h3[data-section=comment]+p]:text-sm [&_h3[data-section=comment]+p]:leading-snug">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children, ...props }) => {
                  const isComment = String(children).trim() === 'Comment';
                  return (
                    <h2 data-section={isComment ? 'comment' : undefined} {...props}>
                      {children}
                    </h2>
                  );
                },
                h3: ({ children, ...props }) => {
                  const isComment = String(children).trim() === 'Comment';
                  return (
                    <h3 data-section={isComment ? 'comment' : undefined} {...props}>
                      {children}
                    </h3>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-0.5 pl-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <ActionButton
            onClick={handleCopy}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
            active={copied}
            activeClass="text-green-600"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </ActionButton>

          <ActionButton
            onClick={() => setFeedback(feedback === 'like' ? null : 'like')}
            title="Good response"
            active={feedback === 'like'}
            activeClass="text-indigo-600"
          >
            <ThumbUpIcon filled={feedback === 'like'} />
          </ActionButton>

          <ActionButton
            onClick={() => setFeedback(feedback === 'dislike' ? null : 'dislike')}
            title="Bad response"
            active={feedback === 'dislike'}
            activeClass="text-red-500"
          >
            <ThumbDownIcon filled={feedback === 'dislike'} />
          </ActionButton>

          {onRetry && (
            <ActionButton onClick={onRetry} title="Retry">
              <RetryIcon />
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  title,
  active,
  activeClass = 'text-indigo-600',
  children,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  activeClass?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? activeClass
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}
