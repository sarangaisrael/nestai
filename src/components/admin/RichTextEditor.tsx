import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Heading2 } from "lucide-react";
import DOMPurify from "dompurify";

const PURIFY_CONFIG = {
  ALLOWED_TAGS: ["b", "i", "u", "strong", "em", "h2", "ul", "ol", "li", "a", "br", "p", "div", "span"] as string[],
  ALLOWED_ATTR: ["href", "target", "rel"] as string[],
  ALLOW_DATA_ATTR: false,
};

export const sanitizeHtml = (html: string): string => DOMPurify.sanitize(html, PURIFY_CONFIG) as string;

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
}

const RichTextEditor = ({ value, onChange, className = "" }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(sanitizeHtml(editorRef.current.innerHTML));
    }
  }, [onChange]);

  const handleLink = () => {
    const url = prompt("הכנס URL:");
    if (url) exec("createLink", url);
  };

  const sanitizedValue = sanitizeHtml(value);

  return (
    <div className={`border border-input rounded-md overflow-hidden bg-background ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-input bg-muted/30 flex-wrap">
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec("bold")} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec("italic")} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec("formatBlock", "H2")} title="Heading">
          <Heading2 className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec("insertUnorderedList")} title="Bullet List">
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec("insertOrderedList")} title="Numbered List">
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={handleLink} title="Link">
          <LinkIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[200px] p-3 text-sm leading-relaxed focus:outline-none prose prose-sm max-w-none [&_a]:text-primary [&_a]:underline"
        dir="rtl"
        dangerouslySetInnerHTML={{ __html: sanitizedValue }}
        onInput={() => {
          if (editorRef.current) {
            onChange(sanitizeHtml(editorRef.current.innerHTML));
          }
        }}
      />
    </div>
  );
};

export default RichTextEditor;