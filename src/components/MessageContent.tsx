
import React from 'react';
import { Message } from '../store/notesStore';
import MessageActions from './MessageActions';

interface MessageContentProps {
  message: Message;
  isEditing: boolean;
  editContent: string;
  setEditContent: (content: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleEdit: () => void;
  handleSave: () => void;
  handleCancel: () => void;
}

type BlockFormat = 'plain' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol';

const getLineBlockFormat = (line: string): { format: BlockFormat, content: string, olIndex?: number} => {
  const trimmedLine = line.trim();
  if (trimmedLine.startsWith('# ')) {
    return { format: 'h1', content: trimmedLine.substring(2) };
  } else if (trimmedLine.startsWith('## ')) {
    return { format: 'h2', content: trimmedLine.substring(3) };
  } else if (trimmedLine.startsWith('### ')) {
    return { format: 'h3', content: trimmedLine.substring(4) };
  } else if (trimmedLine.startsWith('- ')) {
    return { format: 'ul', content: trimmedLine.substring(2) };
  } else if (/^\d+\.\s/.test(trimmedLine)) {
    // numbered list (ol)
    const parts = trimmedLine.match(/^(\d+)\.\s(.*)/);
    if (parts) {
      return { format: 'ol', content: parts[2], olIndex: Number(parts[1])};
    }
  }
  return { format: 'plain', content: line };
};

// Enhanced inline markdown parser that supports nested formatting
function parseInlineMarkdown(content: string): (string | JSX.Element)[] {
  const elements: (string | JSX.Element)[] = [];
  let remaining = content;
  let keyCounter = 0;

  while (remaining.length > 0) {
    // Find the next markdown pattern
    const patterns = [
      { regex: /^`([^`]+)`/, type: 'code' },
      { regex: /^\*\*([^*]+)\*\*/, type: 'bold' },
      { regex: /^\*([^*]+)\*/, type: 'italic' },
      { regex: /^\*\*\*([^*]+)\*\*\*/, type: 'bold-italic' }
    ];

    let matched = false;

    // Check for bold-italic first (longest pattern)
    const boldItalicMatch = remaining.match(/^\*\*\*([^*]+)\*\*\*/);
    if (boldItalicMatch) {
      elements.push(
        <strong key={keyCounter++} className="font-bold">
          <em className="italic">{boldItalicMatch[1]}</em>
        </strong>
      );
      remaining = remaining.slice(boldItalicMatch[0].length);
      matched = true;
    }
    // Check for code blocks
    else if (remaining.startsWith('`')) {
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        elements.push(
          <code key={keyCounter++} className="bg-muted px-1 rounded text-[90%] font-mono">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        matched = true;
      }
    }
    // Check for bold
    else if (remaining.startsWith('**')) {
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        elements.push(
          <strong key={keyCounter++} className="font-bold">{boldMatch[1]}</strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        matched = true;
      }
    }
    // Check for italic
    else if (remaining.startsWith('*')) {
      const italicMatch = remaining.match(/^\*([^*]+)\*/);
      if (italicMatch) {
        elements.push(
          <em key={keyCounter++} className="italic">{italicMatch[1]}</em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        matched = true;
      }
    }

    if (!matched) {
      // Find the next markdown character or take the whole remaining string
      const nextMarkdown = remaining.search(/[*`]/);
      if (nextMarkdown === -1) {
        elements.push(remaining);
        break;
      } else {
        elements.push(remaining.slice(0, nextMarkdown));
        remaining = remaining.slice(nextMarkdown);
      }
    }
  }

  return elements;
}

const MessageContent: React.FC<MessageContentProps> = ({
  message,
  isEditing,
  editContent,
  setEditContent,
  textareaRef,
  handleKeyDown,
  handleEdit,
  handleSave,
  handleCancel
}) => {

  const renderContent = () => {
    if (isEditing) {
      return (
        <textarea
          ref={textareaRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="w-full bg-transparent border border-border rounded-lg p-2 outline-none text-foreground placeholder-muted-foreground resize-none leading-snug focus:ring-2 focus:ring-primary/50 focus:border-primary"
          rows={Math.max(2, editContent.split('\n').length)}
          placeholder="Type your message... Use # for headings, **bold**, *italic*, `code`"
        />
      );
    }

    // Split content by line breaks and render each line with its own formatting
    const lines = message.content.split('\n');
    const renderedLines: React.ReactNode[] = [];

    let currentUlItems: React.ReactNode[] = [];
    let currentOlItems: React.ReactNode[] = [];
    let inUlList = false;
    let inOlList = false;

    lines.forEach((line, index) => {
      const { format, content, olIndex } = getLineBlockFormat(line);

      // Handle list grouping
      if (format === 'ul') {
        if (!inUlList) {
          currentUlItems = [];
          inUlList = true;
        }
        currentUlItems.push(
          <li key={`ul-${index}`} className="leading-snug">
            {parseInlineMarkdown(content)}
          </li>
        );

        // Check if this is the last ul item
        const nextLine = lines[index + 1];
        if (!nextLine || !getLineBlockFormat(nextLine).format.startsWith('ul')) {
          renderedLines.push(
            <ul key={`ul-group-${index}`} className="list-disc list-inside space-y-0 ml-4">
              {currentUlItems}
            </ul>
          );
          inUlList = false;
        }
      } else if (format === 'ol') {
        if (!inOlList) {
          currentOlItems = [];
          inOlList = true;
        }
        currentOlItems.push(
          <li key={`ol-${index}`} className="leading-snug">
            {parseInlineMarkdown(content)}
          </li>
        );

        // Check if this is the last ol item
        const nextLine = lines[index + 1];
        if (!nextLine || !getLineBlockFormat(nextLine).format.startsWith('ol')) {
          renderedLines.push(
            <ol key={`ol-group-${index}`} className="list-decimal list-inside space-y-0 ml-4">
              {currentOlItems}
            </ol>
          );
          inOlList = false;
        }
      } else {
        // Not in a list, render individual line
        inUlList = false;
        inOlList = false;

        // Handle empty lines
        if (line.trim() === '') {
          renderedLines.push(<div key={index} className="h-2" />);
          return;
        }

        switch (format) {
          case 'h1':
            renderedLines.push(
              <h1 key={index} className="text-2xl font-bold leading-tight mb-2">
                {parseInlineMarkdown(content)}
              </h1>
            );
            break;
          case 'h2':
            renderedLines.push(
              <h2 key={index} className="text-xl font-bold leading-tight mb-1.5">
                {parseInlineMarkdown(content)}
              </h2>
            );
            break;
          case 'h3':
            renderedLines.push(
              <h3 key={index} className="text-lg font-semibold leading-tight mb-1">
                {parseInlineMarkdown(content)}
              </h3>
            );
            break;
          default:
            renderedLines.push(
              <p key={index} className="leading-relaxed">
                {parseInlineMarkdown(content)}
              </p>
            );
        }
      }
    });

    return (
      <div className="space-y-1">
        {renderedLines}
      </div>
    );
  };

  return (
    <div
      className={`message-bubble animate-scale-in relative flex-1 min-w-0 py-2 px-3 rounded-lg transition-all ${
        isEditing 
          ? 'bg-background border border-border' 
          : 'cursor-pointer hover:bg-muted/20'
      }`}
      onClick={!isEditing ? handleEdit : undefined}
    >
      {message.image && (
        <div className="mb-2">
          <img
            src={message.image}
            alt="Uploaded content"
            className="max-w-full h-auto rounded-xl neuro-inset p-2"
            style={{ maxWidth: '300px' }}
          />
        </div>
      )}
      
      <div className="text-foreground w-full ">{renderContent()}</div>

      <div
        className="absolute -top-3 -right-3"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <MessageActions message={message} />
      </div>
    </div>
  );
};

export default MessageContent;
