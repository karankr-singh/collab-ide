const EXT_TO_MONACO: Record<string, string> = {
  py: "python",
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  go: "go",
  cpp: "cpp",
  cc: "cpp",
  c: "c",
  h: "cpp",
  json: "json",
  md: "markdown",
  html: "html",
  css: "css",
};

export function monacoLanguageForFile(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return EXT_TO_MONACO[ext] || "plaintext";
}
