export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/ws";
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const SUPPORTED_LANGUAGES = [
  { id: "python", label: "Python", monacoId: "python", defaultFile: "main.py" },
  { id: "javascript", label: "JavaScript", monacoId: "javascript", defaultFile: "main.js" },
  { id: "go", label: "Go", monacoId: "go", defaultFile: "main.go" },
  { id: "cpp", label: "C++", monacoId: "cpp", defaultFile: "main.cpp" },
] as const;

export type LanguageId = (typeof SUPPORTED_LANGUAGES)[number]["id"];

export const STARTER_CODE: Record<LanguageId, string> = {
  python: 'print("hello from your sandbox")\n',
  javascript: 'console.log("hello from your sandbox");\n',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("hello from your sandbox")\n}\n',
  cpp:
    '#include <iostream>\n\nint main() {\n\tstd::cout << "hello from your sandbox" << std::endl;\n\treturn 0;\n}\n',
};
