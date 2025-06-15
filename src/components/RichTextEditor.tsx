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

  // Move per-line: store which kind of inline formats are active for which line
  const [lineActiveInlineFormats, setLineActiveInlineFormats] = useState<
    Record<number, Set<'bold' | 'italic'>>
  >({ 0: new Set() });

  // Updates both content and the mapping for bold/italic
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const textLines = value.split('\n');
    const newLines: LineFormat[] = [];
    const newLineInlineFormats: Record<number, Set<'bold' | 'italic'>> = {};

    textLines.forEach((lineContent, index) => {
      const existingLine = lines[index];
      newLines.push({
        type: existingLine?.type || (index === currentLineIndex ? selectedFormat : (lines[index-1]?.type === "ul" ? "ul" : lines[index-1]?.type === "ol" ? "ol" : 'plain')),
        content: lineContent,
        inlineFormats: existingLine?.inlineFormats || []
      });
      newLineInlineFormats[index] = lineActiveInlineFormats[index] || new Set();
    });

    // Ensure we always have at least one line
    if (newLines.length === 0) {
      newLines.push({ type: 'plain', content: '', inlineFormats: [] });
      newLineInlineFormats[0] = new Set();
    }

    setLines(newLines);
    setLineActiveInlineFormats(newLineInlineFormats);
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

  // When style format is picked, it sets for the current line—in a new location, left to the text line
  const handleLineFormatChange = (lineIdx: number, format: 'plain' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol') => {
    const newLines = [...lines];
    newLines[lineIdx] = {
      ...newLines[lineIdx],
      type: format
    };
    setLines(newLines);
    setSelectedFormat(format);
    updateContent(newLines);
  };

  // Inline format per line — bold/italic
  const handleInlineFormatToggle = (format: 'bold' | 'italic', lineIdx?: number) => {
    const targetIdx = lineIdx === undefined ? currentLineIndex : lineIdx;
    const currentFormats = new Set(lineActiveInlineFormats[targetIdx] || []);
    if (currentFormats.has(format)) {
      currentFormats.delete(format);
    } else {
      currentFormats.add(format);
    }
    setLineActiveInlineFormats({
      ...lineActiveInlineFormats,
      [targetIdx]: currentFormats
    });
  };

  // When typing, add formatting for current line
  const getTextareaLineClass = (idx: number) => {
    const f = lineActiveInlineFormats[idx] || new Set();
    let className = "";
    if (f.has("bold")) className += " font-bold ";
    if (f.has("italic")) className += " italic ";
    return className.trim();
  };

  // On submit: call updateContent to ensure formatting is saved
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Insert new line with previous style for lists (ul, ol), else plain
        e.preventDefault();
        const textarea = e.currentTarget;
        const cursorPos = textarea.selectionStart;
        const value = textarea.value;
        const textLines = value.split('\n');
        const prevType = lines[currentLineIndex]?.type;
        let nextType: LineFormat["type"] = "plain";
        if (prevType === "ul" || prevType === "ol") {
          nextType = prevType;
        }
        const newValue = value.slice(0, cursorPos) + '\n' + value.slice(cursorPos);

        const newLines = [...lines];
        const newLineIndex = currentLineIndex + 1;
        newLines.splice(newLineIndex, 0, { type: nextType, content: '', inlineFormats: [] });

        // Add to active formats object as well
        const newLineInlineFormats = { ...lineActiveInlineFormats };
        newLineInlineFormats[newLineIndex] = new Set();

        setLines(newLines);
        setLineActiveInlineFormats(newLineInlineFormats);
        setCurrentLineIndex(newLineIndex);
        setSelectedFormat(nextType);

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

  // For visual display: move the per-line format picker left of the text input
  return (
    <div className="space-y-3">
      <div className="text-[10px] text-muted-foreground/70 px-2 mb-1">
        Enter to send • Shift+Enter for new line (style persists for lists) • Select style & bold/italic per line
      </div>
      <div className="neuro-inset rounded-xl p-2 relative">
        {/* For each line, show style picker left, input center */}
        {lines.map((line, idx) => (
          <div key={idx} className="flex items-center mb-1 space-x-2">
            <div className="flex flex-col items-center min-w-[68px]">
              <select
                value={line.type}
                onChange={e => handleLineFormatChange(idx, e.target.value as any)}
                className="neuro-button px-2 py-1 rounded text-xs font-medium text-primary w-[64px] focus:outline-none"
                style={{
                  background: 'var(--background)',
                  border: 0,
                  boxShadow: 'var(--tw-ring-shadow)'
                }}
              >
                <option value="plain">Normal</option>
                <option value="h1">H1</option>
                <option value="h2">H2</option>
                <option value="h3">H3</option>
                <option value="ul">Bullets</option>
                <option value="ol">Numbers</option>
              </select>
              {/* inline formats for current line */}
              <div className="flex mt-1 gap-1">
                <button
                  type="button"
                  onClick={() => handleInlineFormatToggle('bold', idx)}
                  className={`px-1 py-0.5 rounded text-[11px] ${lineActiveInlineFormats[idx]?.has("bold") ? "bg-primary/10 text-primary font-bold neuro-pressed" : "text-muted-foreground hover:text-primary"}`}
                >
                  <b>B</b>
                </button>
                <button
                  type="button"
                  onClick={() => handleInlineFormatToggle('italic', idx)}
                  className={`px-1 py-0.5 rounded text-[11px] ${lineActiveInlineFormats[idx]?.has("italic") ? "bg-primary/10 text-primary font-semibold italic neuro-pressed" : "text-muted-foreground hover:text-primary"}`}
                >
                  <em>I</em>
                </button>
              </div>
            </div>
            {/* Textarea for content */}
            <textarea
              ref={idx === currentLineIndex ? textareaRef : undefined}
              value={line.content}
              onChange={e => {
                // update single line in lines
                const newLines = [...lines];
                newLines[idx].content = e.target.value;
                setLines(newLines);
                updateContent(newLines);
              }}
              onFocus={() => {
                setCurrentLineIndex(idx);
                setSelectedFormat(lines[idx]?.type || 'plain');
              }}
              className={`flex-1 bg-transparent border-none outline-none text-foreground placeholder-muted-foreground resize-none text-sm py-1 ${getTextareaLineClass(idx)}`}
              placeholder={idx === 0 ? placeholder : ""}
              rows={1}
              style={{borderBottom: '1px solid #eee'}}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        <div className="text-[10px] text-muted-foreground/70 px-2">
          Style/Bold/Italic on left. "Enter" to send, "Shift+Enter" for new line with list/heading.
        </div>
        <button
          type="button"
          onClick={onSubmit}
          className="neuro-button rounded-lg px-5 py-1.5 text-sm font-semibold text-primary ring-1 ring-primary/20"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default RichTextEditor;
