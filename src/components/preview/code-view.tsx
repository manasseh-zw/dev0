'use client'

import { useState } from 'react'
import {
  FileTree,
  FileTreeFolder,
  FileTreeFile,
} from '@/components/ai-elements/file-tree'
import {
  CodeBlock,
  CodeBlockHeader,
  CodeBlockTitle,
  CodeBlockFilename,
  CodeBlockActions,
  CodeBlockCopyButton,
} from '@/components/ai-elements/code-block'
import { FileIcon } from 'lucide-react'
import type { BundledLanguage } from 'shiki'

// Mock file data for initial UI - will be replaced with sandbox API later
const MOCK_FILES: Record<string, { content: string; language: BundledLanguage }> = {
  'src/App.tsx': {
    content: `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>Hello World</h1>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
    </div>
  )
}

export default App`,
    language: 'tsx',
  },
  'src/index.css': {
    content: `:root {
  font-family: Inter, system-ui, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  min-height: 100vh;
}

.App {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}`,
    language: 'css',
  },
  'src/main.tsx': {
    content: `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)`,
    language: 'tsx',
  },
  'package.json': {
    content: `{
  "name": "sandbox-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.2"
  }
}`,
    language: 'json',
  },
  'vite.config.ts': {
    content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
    language: 'typescript',
  },
  'index.html': {
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sandbox App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
    language: 'html',
  },
}

const DEFAULT_FILE = 'src/App.tsx'

export function CodeView() {
  const [selectedPath, setSelectedPath] = useState<string>(DEFAULT_FILE)
  const [expandedPaths] = useState<Set<string>>(new Set(['src']))

  const selectedFile = MOCK_FILES[selectedPath]
  const filename = selectedPath.split('/').pop() || selectedPath

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* File Tree - 20% width */}
      <div className="w-1/5 min-w-[200px] max-w-[280px] border-r border-border overflow-auto bg-background">
        <div className="p-2 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Files
          </span>
        </div>
        <FileTree
          selectedPath={selectedPath}
          onSelect={setSelectedPath}
          defaultExpanded={expandedPaths}
          className="border-none rounded-none"
        >
          <FileTreeFolder path="src" name="src">
            <FileTreeFile path="src/App.tsx" name="App.tsx" />
            <FileTreeFile path="src/index.css" name="index.css" />
            <FileTreeFile path="src/main.tsx" name="main.tsx" />
          </FileTreeFolder>
          <FileTreeFile path="index.html" name="index.html" />
          <FileTreeFile path="package.json" name="package.json" />
          <FileTreeFile path="vite.config.ts" name="vite.config.ts" />
        </FileTree>
      </div>

      {/* Code Block - 80% width */}
      <div className="flex-1 overflow-auto bg-background">
        {selectedFile ? (
          <CodeBlock
            code={selectedFile.content}
            language={selectedFile.language}
            showLineNumbers
            className="h-full rounded-none border-none"
          >
            <CodeBlockHeader>
              <CodeBlockTitle>
                <FileIcon size={14} />
                <CodeBlockFilename>{filename}</CodeBlockFilename>
              </CodeBlockTitle>
              <CodeBlockActions>
                <CodeBlockCopyButton />
              </CodeBlockActions>
            </CodeBlockHeader>
          </CodeBlock>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a file to view its contents
          </div>
        )}
      </div>
    </div>
  )
}
