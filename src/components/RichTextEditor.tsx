
import { Bold, Heading1, Heading2, Heading3, Image as ImageIcon, Italic, List, ListOrdered, Type } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface RichTextEditorProps {
  onContentChange: (content: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  showImageButton?: boolean;
  onImageClick?: () => void;
  rightActions?: React.ReactNode;
}

type LineFormatType = 'plain' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol';
type InlineFormatType = 'bold' | 'italic';

interface LineFormat {
  type: LineFormatType;
  content: string;
  inlineFormats: Array<{
    start: number;
    end: number;
    type: InlineFormatType;
  }>;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  onContentChange,
  onSubmit,
  placeholder = "Type your message...",
  showImageButton = false,
  onImageClick,
  rightActions
}) => {
  const [lines, setLines] = useState<LineFormat[]>([
    { type: 'plain', content: '', inlineFormats: [] }
  ]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<LineFormatType>('plain');
  const [activeInlineFormats, setActiveInlineFormats] = useState<Set<InlineFormatType>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const formatButtons: Array<{ key: LineFormatType; label: string; icon: typeof Type }>= [
    { key: 'plain', label: 'Normal', icon: Type },
    { key: 'h1', label: 'H1', icon: Heading1 },
    { key: 'h2', label: 'H2', icon: Heading2 },
    { key: 'h3', label: 'H3', icon: Heading3 },
    { key: 'ul', label: 'Bullets', icon: List },
    { key: 'ol', label: 'Numbers', icon: ListOrdered },
  ];

  const inlineFormatButtons: Array<{ key: InlineFormatType; label: string; icon: typeof Bold }>= [
    { key: 'bold', label: 'Bold', icon: Bold },
    { key: 'italic', label: 'Italic', icon: Italic },
  ];

  const getLinePrefix = (type: LineFormatType) => {
    switch (type) {
      case 'h1': return '# ';
      case 'h2': return '## ';
      case 'h3': return '### ';
      case 'ul': return '- ';
      case 'ol': return '1. ';
      default: return '';
    }
  };

  const getVisualPrefix = (type: LineFormatType, index: number, allLines: LineFormat[]) => {
    switch (type) {
      case 'plain': return 'N';
      case 'h1': return 'H1';
      case 'h2': return 'H2';
      case 'h3': return 'H3';
      case 'ul': return '•';
      case 'ol': {
        // Calculate the correct number for ordered lists
        let olNumber = 1;
        for (let i = 0; i < index; i++) {
          if (allLines[i].type === 'ol') {
            olNumber++;
          } else if (allLines[i].type !== 'ol') {
            // Reset numbering when we encounter a non-ol line
            olNumber = 1;
          }
        }
        return `${olNumber}.`;
      }
      default: return 'N';
    }
  };

  const handleLineFormatChange = (format: LineFormatType) => {
    setSelectedFormat(format);
    const newLines = [...lines];
    newLines[currentLineIndex] = {
      ...newLines[currentLineIndex],
      type: format
    };
    setLines(newLines);
    updateContent(newLines);
  };

  const handleInlineFormatToggle = (format: InlineFormatType) => {
    // Toggle active formatting for all new text input
    const newActiveFormats = new Set(activeInlineFormats);
    if (newActiveFormats.has(format)) {
      newActiveFormats.delete(format);
    } else {
      newActiveFormats.add(format);
    }
    setActiveInlineFormats(newActiveFormats);
  };

  const resetEditor = () => {
    setLines([{ type: 'plain', content: '', inlineFormats: [] }]);
    setCurrentLineIndex(0);
    setSelectedFormat('plain');
    setActiveInlineFormats(new Set());
    if (textareaRef.current) {
      textareaRef.current.value = '';
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const textLines = value.split('\n');
    const newLines: LineFormat[] = [];
    const cursorPos = e.target.selectionStart;

    textLines.forEach((lineContent, index) => {
      const existingLine = lines[index];
      const inlineFormats = existingLine?.inlineFormats || [];
      
      // Handle new lines or new content
      if (!existingLine) {
        // This is a completely new line - apply active formatting to any content
        if (lineContent && activeInlineFormats.size > 0) {
          activeInlineFormats.forEach(formatType => {
            inlineFormats.push({
              start: 0,
              end: lineContent.length,
              type: formatType
            });
          });
        }
      } else if (activeInlineFormats.size > 0) {
        // Existing line with new content
        const oldContent = existingLine.content;
        const newContent = lineContent;
        
        // Check if new content was added
        if (newContent.length > oldContent.length) {
          const startPos = oldContent.length;
          const endPos = newContent.length;
          
          // Apply active formatting to the new text
          activeInlineFormats.forEach(formatType => {
            inlineFormats.push({
              start: startPos,
              end: endPos,
              type: formatType
            });
          });
        }
      }
      
      newLines.push({
        type: existingLine?.type || (index === currentLineIndex ? selectedFormat : 'plain'),
        content: lineContent,
        inlineFormats: inlineFormats
      });
    });

    // Ensure we always have at least one line
    if (newLines.length === 0) {
      newLines.push({ type: 'plain', content: '', inlineFormats: [] });
    }

    setLines(newLines);
    updateContent(newLines);

    // Update current line index based on cursor position
    let lineIndex = 0;
    let charCount = 0;
    for (let i = 0; i < textLines.length; i++) {
      if (cursorPos <= charCount + textLines[i].length) {
        lineIndex = i;
        break;
      }
      charCount += textLines[i].length + 1; // +1 for newline
    }
    setCurrentLineIndex(lineIndex);
    setSelectedFormat(newLines[lineIndex]?.type || 'plain');
  };

  const updateContent = (newLines: LineFormat[]) => {
    let olCounter = 1;
    const formattedContent = newLines.map((line, index) => {
      let content = line.content;
      
      // Apply inline formatting
      const sortedFormats = [...line.inlineFormats].sort((a, b) => b.start - a.start);
      sortedFormats.forEach(format => {
        const before = content.slice(0, format.start);
        const middle = content.slice(format.start, format.end);
        const after = content.slice(format.end);
        
        const wrapper = format.type === 'bold' ? '**' : '*';
        content = before + wrapper + middle + wrapper + after;
      });

      // Apply block formatting with proper numbering for ordered lists
      let prefix = '';
      switch (line.type) {
        case 'h1': prefix = '# '; break;
        case 'h2': prefix = '## '; break;
        case 'h3': prefix = '### '; break;
        case 'ul': prefix = '- '; break;
        case 'ol': 
          // Reset counter if previous line was not an ordered list
          if (index === 0 || newLines[index - 1].type !== 'ol') {
            olCounter = 1;
          }
          prefix = `${olCounter}. `;
          olCounter++;
          break;
        default: 
          olCounter = 1; // Reset counter for non-ol lines
          break;
      }
      return prefix + content;
    }).join('\n');

    onContentChange(formattedContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: new line with appropriate formatting
        e.preventDefault();
        const textarea = e.currentTarget;
        const cursorPos = textarea.selectionStart;
        const value = textarea.value;
        const newValue = value.slice(0, cursorPos) + '\n' + value.slice(cursorPos);
        
        const currentLine = lines[currentLineIndex];
        const newLines = [...lines];
        const newLineIndex = currentLineIndex + 1;
        
        // For headings, start new line with plain format
        // For lists, continue with same format
        let newLineFormat: 'plain' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol' = 'plain';
        if (currentLine?.type === 'ul' || currentLine?.type === 'ol') {
          newLineFormat = currentLine.type;
        }
        
        newLines.splice(newLineIndex, 0, { type: newLineFormat, content: '', inlineFormats: [] });
        setLines(newLines);
        setCurrentLineIndex(newLineIndex);
        setSelectedFormat(newLineFormat);
        
        // Update textarea value and cursor position
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.value = newValue;
            textareaRef.current.setSelectionRange(cursorPos + 1, cursorPos + 1);
          }
        }, 0);
      } else {
        // Enter: submit and reset
        e.preventDefault();
        onSubmit();
        resetEditor();
      }
    } else if (e.key === 'Backspace') {
      const textarea = e.currentTarget;
      const cursorPos = textarea.selectionStart;
      const currentLine = lines[currentLineIndex];
      
      // Calculate the start position of current line in the textarea
      const textLines = textarea.value.split('\n');
      let lineStartPos = 0;
      for (let i = 0; i < currentLineIndex; i++) {
        lineStartPos += textLines[i].length + 1; // +1 for newline
      }
      
      // Check if we're at the very beginning of a line (cursor at line start)
      const isAtLineStart = cursorPos === lineStartPos;
      const isLineEmpty = currentLine && currentLine.content.trim() === '';
      
      // Only reset style if we're at the beginning of an empty styled line
      if (isAtLineStart && isLineEmpty && currentLine && currentLine.type !== 'plain') {
        // First backspace: reset style to plain
        e.preventDefault();
        const newLines = [...lines];
        newLines[currentLineIndex] = {
          ...currentLine,
          type: 'plain'
        };
        setLines(newLines);
        setSelectedFormat('plain');
        updateContent(newLines);
        return;
      }
      // If already plain or has content, let default backspace behavior work
    }
  };

  const renderTextareaContent = () => {
    return lines.map((line, index) => {
      const prefix = getLinePrefix(line.type);
      const isCurrentLine = index === currentLineIndex;
      
      return (
        <div key={index} className="flex items-start">
          {prefix && (
            <span className={`text-primary/60 font-mono text-sm mr-1 ${isCurrentLine ? 'text-primary' : ''}`}>
              {prefix}
            </span>
          )}
          <span className={`flex-1 ${isCurrentLine && activeInlineFormats.has('bold') ? 'font-bold' : ''} ${isCurrentLine && activeInlineFormats.has('italic') ? 'italic' : ''}`}>
            {line.content}
          </span>
        </div>
      );
    });
  };

  const currentLineFormatted = lines[currentLineIndex]?.type || 'plain';

  return (
    <div className="space-y-2">
      {/* Format Toolbar */}
      <div className="flex flex-wrap gap-1 items-center">
        {formatButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => handleLineFormatChange(btn.key)}
            className={`neuro-button rounded-lg px-2 py-1 text-xs font-medium transition-all ${
              currentLineFormatted === btn.key
                ? 'text-primary ring-1 ring-primary/30 neuro-pressed' 
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <div className="flex items-center space-x-1">
              <btn.icon className="h-3 w-3" />
              <span>{btn.label}</span>
            </div>
          </button>
        ))}
        
        <div className="w-px h-6 bg-border mx-1" />
        
        {inlineFormatButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => handleInlineFormatToggle(btn.key)}
            className={`neuro-button rounded-lg px-2 py-1 text-xs font-medium transition-all ${
              activeInlineFormats.has(btn.key)
                ? 'text-primary ring-1 ring-primary/30 neuro-pressed' 
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <div className="flex items-center space-x-1">
              <btn.icon className="h-3 w-3" />
              <span>{btn.label}</span>
            </div>
          </button>
        ))}
        <div className="flex-1" />
        {rightActions && (
          <div className="ml-auto flex items-center gap-1">
            {rightActions}
          </div>
        )}
      </div>

      {/* Rich Text Input */}
      <div className="neuro-inset rounded-xl relative" onClick={() => textareaRef.current?.focus()}>
        {/* Visual prefixes overlay */}
        <div className="absolute left-0 top-0 z-10 p-3 pointer-events-none">
          {lines.map((line, index) => {
            const visualPrefix = getVisualPrefix(line.type, index, lines);
            return (
              <div key={index} className="flex items-center min-h-[1.5rem]">
                {visualPrefix && (
                  <span className={`text-[10px] font-medium mr-2 px-1 py-0.5 rounded leading-none ${
                    line.type.startsWith('h') 
                      ? 'text-primary/80 bg-primary/10' 
                      : line.type === 'plain'
                      ? 'text-muted-foreground/60 bg-muted-foreground/5'
                      : 'text-muted-foreground'
                  }`}>
                    {visualPrefix}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        
        <textarea
          ref={textareaRef}
          value={lines.map(line => line.content).join('\n')}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          
          placeholder={placeholder}
          className="w-full bg-transparent border-none outline-none text-transparent placeholder-muted-foreground resize-none text-sm pr-20 relative z-20"
          style={{
            paddingLeft: lines.some((line, index) => getVisualPrefix(line.type, index, lines)) ? '60px' : '12px',
            paddingTop: '12px',
            paddingBottom: '12px',
            lineHeight: '1.5rem',
            caretColor: 'hsl(var(--foreground))'
          }}
          rows={Math.max(2, lines.length)}
        />
        
        {/* Text formatting overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-15">
          <div 
            className="text-sm whitespace-pre-wrap break-words text-muted-foreground"
            style={{
              paddingLeft: lines.some((line, index) => getVisualPrefix(line.type, index, lines)) ? '60px' : '12px',
              paddingTop: '12px',
              paddingBottom: '12px',
              lineHeight: '1.5rem'
            }}
          >
            {lines.map((line, lineIndex) => {
              if (line.content === '') {
                return <div key={lineIndex} style={{ minHeight: '1.5rem' }}>&nbsp;</div>;
              }
              
              const chars = line.content.split('');
              return (
                <div key={lineIndex}>
                  {chars.map((char, charIndex) => {
                    const formats = line.inlineFormats.filter(f => 
                      charIndex >= f.start && charIndex < f.end
                    );
                    
                    const isBold = formats.some(f => f.type === 'bold');
                    const isItalic = formats.some(f => f.type === 'italic');
                    
                    return (
                      <span 
                        key={charIndex}
                        className={`${
                          isBold ? 'font-bold text-foreground' : ''
                        } ${
                          isItalic ? 'italic' : ''
                        }`}
                      >
                        {char}
                      </span>
                    );
                  })}
                  
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Inline Image Button */}
        {showImageButton && onImageClick && (
          <button
            onClick={onImageClick}
            className="absolute bottom-3 right-14 neuro-button rounded-lg p-1.5 text-muted-foreground hover:text-primary transition-all z-30"
            aria-label="Add image"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
        )}
      </div>

    </div>
  );
};

export default RichTextEditor;
