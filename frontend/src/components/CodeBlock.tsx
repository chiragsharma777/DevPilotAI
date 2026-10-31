
import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeBlockProps {
  language?: string;
  children: string;
}

const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
  ps1: "powershell",
  html: "markup",
  xml: "markup",
  svg: "markup",
  yml: "yaml",
  md: "markdown",
  plaintext: "text",
  plain: "text",
  txt: "text",
  "c++": "cpp",
  "c#": "csharp",
  "f#": "fsharp",
};

const FILE_EXTENSIONS: Record<string, string> = {
  javascript: "js",
  jsx: "jsx",
  typescript: "ts",
  tsx: "tsx",
  python: "py",
  java: "java",
  markup: "html",
  css: "css",
  json: "json",
  bash: "sh",
  powershell: "ps1",
  sql: "sql",
  c: "c",
  cpp: "cpp",
  csharp: "cs",
  go: "go",
  rust: "rs",
  php: "php",
  ruby: "rb",
  kotlin: "kt",
  swift: "swift",
  yaml: "yml",
  markdown: "md",
  fsharp: "fs",
  dart: "dart",
  r: "r",
  dockerfile: "dockerfile",
  makefile: "makefile",
  ini: "ini",
  toml: "toml",
  graphql: "graphql",
  diff: "diff",
  text: "txt",
};

function normalizeLanguage(language?: string): string {
  const normalized = (language ?? "").trim().toLowerCase();

  if (!normalized) {
    return "text";
  }

  return LANGUAGE_ALIASES[normalized] ?? normalized;
}

export default function CodeBlock({
  language = "text",
  children,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const code = children.replace(/\n$/, "");
  const normalizedLanguage = normalizeLanguage(language);
  const extension = FILE_EXTENSIONS[normalizedLanguage] ?? "txt";

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopied(false);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyCode() {
    if (copying) {
      return;
    }

    setCopying(true);
    setCopyError(false);

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      let textarea: HTMLTextAreaElement | null = null;

      try {
        textarea = document.createElement("textarea");
        textarea.value = code;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        textarea.setAttribute("readonly", "");

        document.body.appendChild(textarea);
        textarea.select();

        const success = document.execCommand("copy");

        if (success) {
          setCopied(true);
        } else {
          setCopyError(true);
        }
      } catch {
        setCopyError(true);
      } finally {
        textarea?.remove();
      }
    } finally {
      setCopying(false);
    }
  }

  function downloadCode() {
    const blob = new Blob([code], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `devpilot-code.${extension}`;
    anchor.style.display = "none";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-language">
          {language.trim() || "text"}
        </span>

        <div className="code-actions">
          <button
            type="button"
            onClick={copyCode}
            disabled={copying}
            aria-label="Copy code to clipboard"
            title={copyError ? "Copy failed" : "Copy code"}
          >
            {copying
              ? "Copying..."
              : copied
                ? "Copied!"
                : copyError
                  ? "Retry copy"
                  : "Copy"}
          </button>

          <button
            type="button"
            onClick={downloadCode}
            aria-label={`Download code as a .${extension} file`}
            title="Download code"
          >
            Download
          </button>
        </div>
      </div>

      <SyntaxHighlighter
        language={normalizedLanguage === "text" ? "text" : normalizedLanguage}
        style={oneDark}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: "18px",
          background: "#111113",
          fontSize: "13px",
          lineHeight: 1.7,
          overflowX: "auto",
        }}
        codeTagProps={{
          style: {
            fontFamily: 'Consolas, "Courier New", monospace',
          },
        }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
