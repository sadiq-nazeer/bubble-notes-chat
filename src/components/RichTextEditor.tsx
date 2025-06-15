
import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Type } from 'lucide-react';

interface RichTextEditorProps {
  onContentChange: (content: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

interface LineFormat {
  type: 'plain' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol';
  content: string;
  inlineFormats: Array<{
    start: number;
    end: number;
    type: 'bold' | 'italic';
  }>;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  onContentChange,
  onSubmit,
  placeholder = "Type your message..."
}) => {
  const [lines, setLines] = useState<LineFormat[]>([
    { type: 'plain', content: '', inlineFormats: [] }
  ]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<'plain' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol'>('plain');
  const [activeInlineFormats, setActiveInlineFormats] = useState<Set<'bold' | 'italic'>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  const formatButtons = [
    { key: 'plain', label: 'Normal', icon: Type },
    { key: 'h1', label: 'H1', icon: Heading1 },
    { key: 'h2', label: 'H2', icon: Heading2 },
    { key: 'h3', label: 'H3', icon: Heading3 },
    { key: 'ul', label: 'Bullets', icon: List },
    { key: 'ol', label: 'Numbers', icon: ListOrdered },
  ];

  const inlineFormatButtons = [
    { key: 'bold', label: 'Bold', icon: Bold },
    { key: 'italic', label: 'Italic', icon: Italic },
  ];

  const getLinePrefix = (type: string) => {
    switch (type) {
      case 'h1': return '# ';
      case 'h2': return '## ';
      case 'h3': return '### ';
      case 'ul': return '- ';
      case 'ol': return '1. ';
      default: return '';
    }
  };

  const handleLineFormatChange = (format: 'plain' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol') => {
    setSelectedFormat(format);
    const newLines = [...lines];
    newLines[currentLineIndex] = {
      ...newLines[currentLineIndex],
      type: format
    };
    setLines(newLines);
    updateContent(newLines);
  };

  const handleInlineFormatToggle = (format: 'bold' | 'italic') => {
    const newActiveFormats = new Set(activeInlineFormats);
    if (newActiveFormats.has(format)) {
      newActiveFormats.delete(format);
    } else {
      newActiveFormats.add(format);
    }
    setActiveInlineFormats(newActiveFormats);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const textLines = value.split('\n');
    const newLines: LineFormat[] = [];

    textLines.forEach((lineContent, index) => {
      const existingLine = lines[index];
      newLines.push({
        type: existingLine?.type || (index === currentLineIndex ? selectedFormat : 'plain'),
        content: lineContent,
        inlineFormats: existingLine?.inlineFormats || []
      });
    });

    // Ensure we always have at least one line
    if (newLines.length === 0) {
      newLines.push({ type: 'plain', content: '', inlineFormats: [] });
    }

    setLines(newLines);
    updateContent(newLines);

    // Update current line index based on cursor position
    const cursorPos = e.target.selectionStart;
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
    const formattedContent = newLines.map(line => {
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

      // Apply block formatting
      const prefix = getLinePrefix(line.type);
      return prefix + content;
    }).join('\n');

    onContentChange(formattedContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: new line with plain formatting
        e.preventDefault();
        const textarea = e.currentTarget;
        const cursorPos = textarea.selectionStart;
        const value = textarea.value;
        const newValue = value.slice(0, cursorPos) + '\n' + value.slice(cursorPos);
        
        const newLines = [...lines];
        const newLineIndex = currentLineIndex + 1;
        newLines.splice(newLineIndex, 0, { type: 'plain', content: '', inlineFormats: [] });
        setLines(newLines);
        setCurrentLineIndex(newLineIndex);
        setSelectedFormat('plain');
        
        // Update textarea value and cursor position
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.value = newValue;
            textareaRef.current.setSelectionRange(cursorPos + 1, cursorPos + 1);
          }
        }, 0);
      } else {
        // Enter: submit
        e.preventDefault();
        onSubmit();
      }
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
    <div className="space-y-3">
      {/* Format Toolbar */}
      <div className="flex flex-wrap gap-1">
        {formatButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => handleLineFormatChange(btn.key as any)}
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
            onClick={() => handleInlineFormatToggle(btn.key as any)}
            className={`neuro-button rounded-lg px-2 py-1 text-xs font-medium transition-all ${
              activeInlineFormats.has(btn.key as any)
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
      </div>

      {/* Rich Text Input */}
      <div className="neuro-inset rounded-xl p-3 relative">
        <textarea
          ref={textareaRef}
          value={lines.map(line => line.content).join('\n')}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent border-none outline-none text-foreground placeholder-muted-foreground resize-none text-sm"
          rows={Math.max(3, lines.length)}
        />
        
        {/* Visual formatting overlay */}
        <div className="absolute inset-3 pointer-events-none overflow-hidden">
          <div className="text-sm leading-normal whitespace-pre-wrap break-words">
            {lines.map((line, index) => {
              const prefix = getLinePrefix(line.type);
              return (
                <div key={index} className="flex items-start min-h-[1.25rem]">
                  {prefix && (
                    <span className="text-primary/60 font-mono mr-1 flex-shrink-0">
                      {prefix}
                    </span>
                  )}
                  <span className="flex-1 invisible">
                    {line.content || '\u00A0'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="text-[10px] text-muted-foreground/70 px-2">
        <div>Enter to send • Shift+Enter for new line (plain style)</div>
        <div>Select format for current line • Use Bold/Italic for inline formatting</div>
      </div>
    </div>
  );
};

export default RichTextEditor;
