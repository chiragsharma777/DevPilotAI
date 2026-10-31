
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./components/CodeBlock";

interface MessageContentProps {
  content: string;
}

export default function MessageContent({
  content,
}: MessageContentProps) {
  return (
    <div className="dp-message-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1>{children}</h1>,
          h2: ({ children }) => <h2>{children}</h2>,
          h3: ({ children }) => <h3>{children}</h3>,

          p: ({ children }) => <p>{children}</p>,

          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children }) => <li>{children}</li>,

          blockquote: ({ children }) => (
            <blockquote>{children}</blockquote>
          ),

          table: ({ children }) => (
            <div className="markdown-table-wrapper">
              <table>{children}</table>
            </div>
          ),

          thead: ({ children }) => <thead>{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => <th>{children}</th>,
          td: ({ children }) => <td>{children}</td>,

          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),

          code: ({ children, className }) => {
            const match = /language-([\w+#.-]+)/.exec(
              className || ""
            );

            const language = match?.[1];
            const code = String(children).replace(/\n$/, "");

            if (language) {
              return (
                <CodeBlock language={language}>
                  {String(children)}
                </CodeBlock>
              );
            }

            return (
              <code className="inline-code">
                {code}
              </code>
            );
          },

          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
