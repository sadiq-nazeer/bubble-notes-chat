
import { Bold, Heading1, Heading2, Heading3, Image as ImageIcon, Italic, List, ListOrdered, Type } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

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
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render counter

  // Force update counter for overlay synchronization
  const forceUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const prefixOverlayRef = useRef<HTMLDivElement>(null);

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

  const getLinePrefix = (type: LineFormatType | undefined) => {
    const safeType = type || 'plain';
    switch (safeType) {
      case 'h1': return '# ';
      case 'h2': return '## ';
      case 'h3': return '### ';
      case 'ul': return '- ';
      case 'ol': return '1. ';
      default: return '';
    }
  };

  const getVisualPrefix = (type: LineFormatType | undefined, index: number, allLines: LineFormat[]) => {
    const safeType = type || 'plain';
    switch (safeType) {
      case 'plain': return 'N';
      case 'h1': return 'H1';
      case 'h2': return 'H2';
      case 'h3': return 'H3';
      case 'ul': return '•';
      case 'ol': {
        // Calculate the correct number for ordered lists
        let olNumber = 1;
        for (let i = 0; i < index; i++) {
          if (allLines[i]?.type === 'ol') {
            olNumber++;
          } else if (allLines[i]?.type !== 'ol') {
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
      // Reset height to minimum
      textareaRef.current.style.height = '48px';
    }
    if (overlayRef.current) {
      overlayRef.current.scrollTop = 0;
    }
    if (prefixOverlayRef.current) {
      prefixOverlayRef.current.scrollTop = 0;
    }
  };

  // Sync overlay scroll with textarea scroll
  const handleTextareaScroll = () => {
    if (textareaRef.current) {
      const scrollTop = textareaRef.current.scrollTop;
      if (overlayRef.current) {
        overlayRef.current.scrollTop = scrollTop;
      }
      if (prefixOverlayRef.current) {
        prefixOverlayRef.current.scrollTop = scrollTop;
      }
    }
  };

  // Detect and convert markdown-like syntax to line formats
  const detectMarkdownFormat = (lineContent: string): { type: LineFormatType; content: string; inlineFormats: Array<{start: number; end: number; type: InlineFormatType}> } => {
    const trimmed = lineContent.trim();

    // Heading detection (most specific first)
    if (trimmed.startsWith('### ')) {
      return { type: 'h3', content: trimmed.substring(4), inlineFormats: [] };
    }
    if (trimmed.startsWith('## ')) {
      return { type: 'h2', content: trimmed.substring(3), inlineFormats: [] };
    }
    if (trimmed.startsWith('# ')) {
      return { type: 'h1', content: trimmed.substring(2), inlineFormats: [] };
    }

    // Alternative heading formats
    if (trimmed.toLowerCase().startsWith('heading ') || trimmed.toLowerCase().startsWith('header ')) {
      return { type: 'h1', content: trimmed, inlineFormats: [] };
    }

    // List detection
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      return { type: 'ul', content: trimmed.substring(2), inlineFormats: [] };
    }

    // Ordered list detection (1. 2. 3. etc., or i. ii. iii., or a. b. c.)
    if (/^\d+\.\s/.test(trimmed) || /^[a-z]+\.\s/.test(trimmed) || /^[ivxlcdm]+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^([a-z0-9]+)\.\s(.*)$/i);
      if (match) {
        return { type: 'ol', content: match[2], inlineFormats: [] };
      }
    }

    // Task list detection
    if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ') || trimmed.startsWith('* [ ] ') || trimmed.startsWith('* [x] ')) {
      return { type: 'ul', content: trimmed.substring(6), inlineFormats: [] };
    }

    // Code block detection
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      return { type: 'plain', content: trimmed, inlineFormats: [] };
    }
    if (trimmed.startsWith('`') && trimmed.endsWith('`') && trimmed.length > 2) {
      return { type: 'plain', content: trimmed, inlineFormats: [] };
    }

    // Quote detection
    if (trimmed.startsWith('> ') || trimmed.startsWith('"') || trimmed.startsWith("'")) {
      return { type: 'plain', content: trimmed.startsWith('> ') ? trimmed.substring(2) : trimmed, inlineFormats: [] };
    }

    // Horizontal rule detection
    if (/^[-*_]{3,}$/.test(trimmed)) {
      return { type: 'plain', content: '', inlineFormats: [] };
    }

    // Default to plain text
    return { type: 'plain', content: lineContent, inlineFormats: [] };
  };

  // Handle paste event with markdown detection
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text/plain');

    if (pastedText && pastedText.includes('\n')) {
      e.preventDefault();

      const textarea = e.currentTarget;
      const cursorPos = textarea.selectionStart;
      const currentValue = textarea.value;

      // Insert pasted text at cursor position
      const newValue = currentValue.substring(0, cursorPos) + pastedText + currentValue.substring(cursorPos);

      // Update textarea value directly
      textarea.value = newValue;

      // Calculate new cursor position (after the pasted text)
      const newCursorPos = cursorPos + pastedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);

      // Trigger the normal change handler to process the new content
      const syntheticEvent = {
        target: textarea,
        currentTarget: textarea
      } as React.ChangeEvent<HTMLTextAreaElement>;

      handleTextChange(syntheticEvent);

      // Force overlay synchronization and ensure cursor is visible
      setTimeout(() => {
        forceOverlaySync();
        autoResize();
        setForceUpdate(prev => prev + 1);
      }, 10);

      setTimeout(() => {
        ensureCursorVisible();
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 50);
    } else {
      // Single line paste - handle it the same way but simpler
      e.preventDefault();

      const textarea = e.currentTarget;
      const cursorPos = textarea.selectionStart;
      const currentValue = textarea.value;

      // Insert pasted text at cursor position
      const newValue = currentValue.substring(0, cursorPos) + pastedText + currentValue.substring(cursorPos);

      // Update textarea value directly
      textarea.value = newValue;

      // Calculate new cursor position (after the pasted text)
      const newCursorPos = cursorPos + pastedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);

      // Trigger the normal change handler to process the new content
      const syntheticEvent = {
        target: textarea,
        currentTarget: textarea
      } as React.ChangeEvent<HTMLTextAreaElement>;

      handleTextChange(syntheticEvent);

      // Force overlay synchronization and ensure cursor is visible
      setTimeout(() => {
        forceOverlaySync();
        autoResize();
        setForceUpdate(prev => prev + 1);
      }, 10);

      setTimeout(() => {
        ensureCursorVisible();
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 50);
    }
  };

  // Auto-resize function with dynamic height and reasonable maximum
  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const minHeight = 48; // 2 lines minimum
      const maxHeight = 320; // Reasonable maximum height for good UX
      
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
      
      // Keep scrolling enabled for better UX
        textareaRef.current.style.overflowY = 'auto';
    }
  };

  // Force immediate synchronization of overlays
  const forceOverlaySync = useCallback(() => {
    if (overlayRef.current && textareaRef.current) {
      const textarea = textareaRef.current;
      const overlay = overlayRef.current;

      // Sync scroll position
      overlay.scrollTop = textarea.scrollTop;
      overlay.scrollLeft = textarea.scrollLeft;

      if (prefixOverlayRef.current) {
        prefixOverlayRef.current.scrollTop = textarea.scrollTop;
        prefixOverlayRef.current.scrollLeft = textarea.scrollLeft;
      }

      // Force re-render of overlays
      setForceUpdate(prev => prev + 1);

      // Clear any existing timeout
      if (forceUpdateTimeoutRef.current) {
        clearTimeout(forceUpdateTimeoutRef.current);
      }
    }
  }, []);


  // Ensure cursor is visible - handles pasted content and manual typing
  const ensureCursorVisible = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;

      // Simple and reliable approach: use textarea's built-in scroll behavior
      // Get the cursor position and ensure it's visible
      const cursorPos = textarea.selectionStart;

      // Use the textarea's scrollHeight and clientHeight to determine if scrolling is needed
      const textBeforeCursor = textarea.value.substring(0, cursorPos);
      const linesBeforeCursor = textBeforeCursor.split('\n').length - 1; // Number of line breaks before cursor

      // Approximate line height (this is simpler than measuring text)
      const computedStyle = window.getComputedStyle(textarea);
      const lineHeight = parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.2;

      // Calculate approximate position of cursor
      const cursorY = linesBeforeCursor * lineHeight;

      // Get visible area bounds
      const visibleTop = textarea.scrollTop;
      const visibleBottom = visibleTop + textarea.clientHeight;

      // Check if cursor is outside visible area and scroll accordingly
      if (cursorY < visibleTop) {
        // Cursor is above visible area - scroll up to show cursor
        textarea.scrollTop = Math.max(0, cursorY - lineHeight);
      } else if (cursorY > visibleBottom - lineHeight) {
        // Cursor is below visible area - scroll down to show cursor
        textarea.scrollTop = cursorY - textarea.clientHeight + lineHeight * 2;
      }

      // Also sync overlays after scrolling
      if (overlayRef.current) {
        overlayRef.current.scrollTop = textarea.scrollTop;
      }
      if (prefixOverlayRef.current) {
        prefixOverlayRef.current.scrollTop = textarea.scrollTop;
      }
    }
  };

  // Set initial height on mount and handle window resize
  useEffect(() => {
    autoResize();
    
    const handleResize = () => {
      autoResize();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-resize when lines change (including after paste)
  useEffect(() => {
    // Small delay to ensure DOM has updated after state change
    const timeoutId = setTimeout(() => {
      autoResize();
      // Ensure overlays are synchronized after state changes
      if (overlayRef.current && textareaRef.current) {
        const textarea = textareaRef.current;
        const overlay = overlayRef.current;

        // Sync scroll position
        overlay.scrollTop = textarea.scrollTop;
        overlay.scrollLeft = textarea.scrollLeft;

        if (prefixOverlayRef.current) {
          prefixOverlayRef.current.scrollTop = textarea.scrollTop;
          prefixOverlayRef.current.scrollLeft = textarea.scrollLeft;
        }
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [lines]);

  // Cleanup force update timeout on unmount
  useEffect(() => {
    const currentTimeout = forceUpdateTimeoutRef.current;
    return () => {
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }
    };
  }, []);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

      // Detect markdown format for new content or changed lines
      let lineType = existingLine?.type || (index === currentLineIndex ? selectedFormat : 'plain');
      let processedContent = lineContent;

      // Only auto-detect format for lines that are being added or significantly changed
      if (!existingLine || existingLine.content !== lineContent) {
        // Check if the line content has markdown syntax that should be converted
        const detectedFormat = detectMarkdownFormat(lineContent);
        if (detectedFormat.type !== 'plain') {
          lineType = detectedFormat.type;
          processedContent = detectedFormat.content;
        }
      }
      
      newLines.push({
        type: lineType,
        content: processedContent,
        inlineFormats: inlineFormats
      });
    });

    // Ensure we always have at least one line
    if (newLines.length === 0) {
      newLines.push({ type: 'plain', content: '', inlineFormats: [] });
    }

    // Use flushSync for synchronous state updates during typing to prevent cursor jumping
    flushSync(() => {
      setLines(newLines);
      updateContent(newLines);
    });

    // Auto-resize textarea based on content
    autoResize();

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
  }, [lines, currentLineIndex, selectedFormat, activeInlineFormats]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateContent = useCallback((newLines: LineFormat[]) => {
    let olCounter = 1;
    const formattedContent = newLines.map((line, index) => {
      let content = line.content;

      // Apply inline formatting
      const inlineFormats = line.inlineFormats || [];
      const sortedFormats = [...inlineFormats].sort((a, b) => b.start - a.start);
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
  }, [onContentChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: new line with appropriate formatting
        e.preventDefault();
        
        const currentLine = lines[currentLineIndex];
        const newLines = [...lines];
        const newLineIndex = currentLineIndex + 1;
        
        // For headings, start new line with plain format
        // For lists, continue with same format
        let newLineFormat: 'plain' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol' = 'plain';
        if (currentLine?.type === 'ul' || currentLine?.type === 'ol') {
          newLineFormat = currentLine.type;
        }
        
        // Calculate cursor position within the current line more accurately
        const textarea = e.currentTarget;
        const cursorPos = textarea.selectionStart;

        // Get the current textarea value to calculate line positions
        const textareaValue = textarea.value;
        const textLines = textareaValue.split('\n');

        // Find which line the cursor is currently on
        let charCount = 0;
        let actualCurrentLineIndex = 0;

        for (let i = 0; i < textLines.length; i++) {
          const lineLength = textLines[i].length;
          if (cursorPos <= charCount + lineLength) {
            actualCurrentLineIndex = i;
            break;
          }
          charCount += lineLength + 1; // +1 for newline
        }

        // Update currentLineIndex if it's different
        if (actualCurrentLineIndex !== currentLineIndex) {
          setCurrentLineIndex(actualCurrentLineIndex);
        }

        // Calculate relative cursor position within the current line
        let lineStartPos = 0;
        for (let i = 0; i < actualCurrentLineIndex; i++) {
          lineStartPos += textLines[i].length + 1; // +1 for newline
        }

        const relativeCursorPos = cursorPos - lineStartPos;
        const currentLineContent = textLines[actualCurrentLineIndex] || '';

        // Split the current line content at cursor position
        const beforeCursor = currentLineContent.substring(0, relativeCursorPos);
        const afterCursor = currentLineContent.substring(relativeCursorPos);

        // Update current line with content before cursor
        newLines[actualCurrentLineIndex] = {
          ...newLines[actualCurrentLineIndex],
          content: beforeCursor
        };

        // Insert new line at the correct position
        const actualNewLineIndex = actualCurrentLineIndex + 1;
        newLines.splice(actualNewLineIndex, 0, {
          type: newLineFormat,
          content: afterCursor, // Put remaining content in new line
          inlineFormats: []
        });

        setLines(newLines);
        setCurrentLineIndex(actualNewLineIndex);
        setSelectedFormat(newLineFormat);

        // Update content for parent component
        updateContent(newLines);

        // Position cursor at the start of the new line
        setTimeout(() => {
          if (textareaRef.current) {
            // Calculate cursor position for the start of the new line
            let charCount = 0;
            for (let i = 0; i < actualNewLineIndex; i++) {
              charCount += newLines[i].content.length + 1; // +1 for newline
            }

            textareaRef.current.setSelectionRange(charCount, charCount);
            ensureCursorVisible();
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
      <div className="neuro-inset rounded-xl relative overflow-hidden max-h-80" onClick={() => textareaRef.current?.focus()}>
        {/* Visual prefixes overlay */}
        <div key={`prefix-${forceUpdate}`} ref={prefixOverlayRef} className="absolute left-0 top-0 z-10 p-3 pointer-events-none select-none overflow-auto scrollbar-hide" style={{
          maxHeight: '320px',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
        }}>
          {lines.map((line, index) => {
            const visualPrefix = getVisualPrefix(line.type, index, lines);
            return (
              <div key={index} className="flex items-center min-h-[1.5rem]">
                {visualPrefix && (
                  <span className={`text-[10px] font-medium mr-2 px-1 py-0.5 rounded leading-none ${
                    (line.type || 'plain').startsWith('h')
                      ? 'text-primary/80 bg-primary/10' 
                      : (line.type || 'plain') === 'plain'
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
          onFocus={ensureCursorVisible}
          onScroll={handleTextareaScroll}
          onPaste={handlePaste}
          
          placeholder={placeholder}
          className="w-full bg-transparent border-none outline-none text-transparent placeholder-muted-foreground resize-none text-sm pr-20 relative z-20"
          style={{
            paddingLeft: lines.some((line, index) => getVisualPrefix(line.type, index, lines)) ? '60px' : '12px',
            paddingTop: '12px',
            paddingBottom: '12px',
            lineHeight: '1.5rem',
            caretColor: 'hsl(var(--foreground))',
            minHeight: '48px', // 2 lines minimum
            maxHeight: '320px', // Fixed max height for scrolling
            overflowY: 'auto', // Always enable scrolling
            scrollbarWidth: 'thin', // For Firefox
            scrollbarColor: 'hsl(var(--border)) transparent' // For Firefox
          }}
        />
        
        {/* Text formatting overlay */}
        <div key={`overlay-${forceUpdate}`} ref={overlayRef} className="absolute inset-0 pointer-events-none overflow-auto z-15 select-none scrollbar-hide" style={{
          maxHeight: '320px',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
        }}>
          <div
            className="text-sm whitespace-pre-wrap break-words text-foreground caret-transparent"
            style={{
              paddingLeft: lines.some((line, index) => getVisualPrefix(line.type, index, lines)) ? '60px' : '12px',
              paddingTop: '12px',
              paddingBottom: '12px',
              lineHeight: '1.5rem',
              minHeight: '48px',
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          >
            {lines.map((line, lineIndex) => {
              if (line.content === '' || line.content.trim() === '') {
                return <div key={lineIndex} style={{ minHeight: '1.5rem', lineHeight: '1.5rem' }}>&nbsp;</div>;
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
