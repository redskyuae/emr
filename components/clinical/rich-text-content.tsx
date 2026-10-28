import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

export function RichTextContent({ value, className }: { value: string; className?: string }) {
  return (
    <div
      className={cn(
        'text-sm whitespace-pre-wrap [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2 [&_ul]:list-disc [&_ul]:pl-5',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children }) => <>{children}</>,
          img: () => null,
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  );
}
