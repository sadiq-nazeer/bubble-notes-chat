
import React from 'react';
import { Message } from '../store/notesStore';

interface MessageContentProps {
  message: Message;
  isEditing: boolean;
  editContent: string;
  setEditContent: (content: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleEdit: () => void;
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

// Very simple inline md parser: will parse **bold**, *italic*, and `code`
function parseInlineMarkdown(content: string): (string | JSX.Element)[] {
  // Handle code first, then bold, then italic
  let elements: (string | JSX.Element)[] = [];
  let remaining = content;
  while (remaining.length > 0) {
    const codeIdx = remaining.indexOf('`');
    const boldIdx = remaining.indexOf('**');
    const italicIdx = remaining.indexOf('*');
    let nextIdx = -1;

    // Find earliest markdown marker
    [codeIdx, boldIdx, italicIdx].forEach((idx) => {
      if (idx !== -1 && (nextIdx === -1 || idx < nextIdx)) nextIdx = idx;
    });

    if (nextIdx === -1) {
      elements.push(remaining);
      break;
    }

    if (nextIdx > 0) {
      elements.push(remaining.substring(0, nextIdx));
      remaining = remaining.substring(nextIdx);
    }

    // Inline code match
    if (remaining.startsWith('`')) {
      const closeIdx = remaining.indexOf('`', 1);
      if (closeIdx > 0) {
        elements.push(
          <code key={elements.length} className="bg-muted px-1 rounded text-[90%]">{remaining.slice(1, closeIdx)}</code>
        );
        remaining = remaining.slice(closeIdx + 1);
        continue;
      } else {
        elements.push('`');
        remaining = remaining.slice(1);
        continue;
      }
    }

    // Bold match
    if (remaining.startsWith('**')) {
      const closeIdx = remaining.indexOf('**', 2);
      if (closeIdx > 1) {
        elements.push(
          <strong key={elements.length} className="font-bold">{remaining.slice(2, closeIdx)}</strong>
        );
        remaining = remaining.slice(closeIdx + 2);
        continue;
      } else {
        elements.push('**');
        remaining = remaining.slice(2);
        continue;
      }
    }

    // Italic match (must not be part of a bold match)
    if (remaining.startsWith('*')) {
      const closeIdx = remaining.indexOf('*', 1);
      if (closeIdx > 0) {
        elements.push(
          <em key={elements.length} className="italic">{remaining.slice(1, closeIdx)}</em>
        );
        remaining = remaining.slice(closeIdx + 1);
        continue;
      } else {
        elements.push('*');
        remaining = remaining.slice(1);
        continue;
      }
    }
    // If nothing matched (shouldn't happen):
    elements.push(remaining[0]);
    remaining = remaining.slice(1);
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
  handleEdit
}) => {

  // Returns an array of rendered block elements for the message content
  const renderContent = () => {
    if (isEditing) {
      return (
        <textarea
          ref={textareaRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent border-none outline-none text-foreground placeholder-muted-foreground resize-none leading-snug"
          rows={Math.max(2, editContent.split('\n').length)}
        />
      );
    }

    const lines = message.content.split('\n');

    // Render as individual lines each with block style & inline md
    let olCounter = 1;
    let insideUl = false, insideOl = false;
    let rendered: React.ReactNode[] = [];
    let ulItems: React.ReactNode[] = [];
    let olItems: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      const { format, content, olIndex } = getLineBlockFormat(line);

      if (format === 'ul') {
        if (!insideUl) {
          ulItems = [];
          insideUl = true;
        }
        ulItems.push(
          <li key={"ul-"+index} className="leading-snug pl-1">{parseInlineMarkdown(content)}</li>
        );
        if (index === lines.length - 1 || getLineBlockFormat(lines[index + 1]).format !== 'ul') {
          rendered.push(
            <ul key={"ul-group-"+index} className="list-disc list-inside space-y-0">
              {ulItems}
            </ul>
          );
          insideUl = false;
          ulItems = [];
        }
      } else if (format === 'ol') {
        if (!insideOl) {
          olItems = [];
          insideOl = true;
          olCounter = olIndex ?? 1;
        }
        olItems.push(
          <li key={"ol-"+index} className="leading-snug pl-1">{parseInlineMarkdown(content)}</li>
        );
        if (index === lines.length - 1 || getLineBlockFormat(lines[index + 1]).format !== 'ol') {
          rendered.push(
            <ol key={"ol-group-"+index} className="list-decimal list-inside space-y-0">
              {olItems}
            </ol>
          );
          insideOl = false;
          olItems = [];
        }
      } else {
        // End any open list
        insideUl = false;
        insideOl = false;

        switch (format) {
          case 'h1':
            rendered.push(
              <h1 key={index} className="text-2xl font-bold leading-snug mb-2">{parseInlineMarkdown(content)}</h1>
            );
            break;
          case 'h2':
            rendered.push(
              <h2 key={index} className="text-xl font-bold leading-snug mb-1.5">{parseInlineMarkdown(content)}</h2>
            );
            break;
          case 'h3':
            rendered.push(
              <h3 key={index} className="text-lg font-bold leading-snug mb-1">{parseInlineMarkdown(content)}</h3>
            );
            break;
          default:
            rendered.push(
              <p key={index} className="leading-snug">{parseInlineMarkdown(content)}</p>
            );
        }
      }
    });

    return (
      <div className="space-y-1">
        {rendered}
      </div>
    );
  };

  return (
    <div
      className="message-bubble animate-scale-in cursor-pointer flex-1 py-2 px-3"
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
      
      <div className="text-foreground">
        {renderContent()}
      </div>
    </div>
  );
};

export default MessageContent;
