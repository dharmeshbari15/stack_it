'use client';

import CodeSnippetRenderer from '@/components/CodeSnippetRenderer';
import CodeBlockParser from '@/components/CodeBlockParser';
import Navbar from '@/components/Navbar';

const EXAMPLE_JAVASCRIPT = `// Fibonacci sequence generator
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Generate first 10 fibonacci numbers
for (let i = 0; i < 10; i++) {
  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}`;

const EXAMPLE_PYTHON = `# Calculate factorial
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

# Test the function
for i in range(1, 6):
    print(f"factorial({i}) = {factorial(i)}")`;

const EXAMPLE_SQL = `-- Get top users by reputation
SELECT 
  u.id,
  u.username,
  COUNT(DISTINCT q.id) as total_questions,
  SUM(COALESCE(rh.change, 0)) as total_reputation
FROM "User" u
LEFT JOIN "Question" q ON u.id = q.author_id
LEFT JOIN "ReputationHistory" rh ON u.id = rh.user_id
GROUP BY u.id, u.username
ORDER BY total_reputation DESC
LIMIT 10;`;

const EXAMPLE_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Code Snippet Example</title>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 800px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to Our Site</h1>
    <p>This is an example HTML snippet.</p>
  </div>
</body>
</html>`;

const MARKDOWN_CONTENT = `# Code Snippet Integration Guide

Here's a basic JavaScript example:

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');
\`\`\`

You can also use Python for data processing:

\`\`\`python
import json

data = {'name': 'Stack It', 'version': '1.0'}
print(json.dumps(data, indent=2))
\`\`\`

And CSS for styling:

\`\`\`css
.code-block {
  background-color: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  overflow-x: auto;
}
\`\`\`

That's how you use code snippets in our forum!`;

export default function CodeSnippetDemo() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-2">Code Snippet Renderer Demo</h1>
        <p className="text-gray-400 mb-8">
          Essential component for dev forums with syntax highlighting, copy button, and execution support.
        </p>

        {/* JavaScript Example */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">JavaScript with Execution</h2>
          <CodeSnippetRenderer
            code={EXAMPLE_JAVASCRIPT}
            language="javascript"
            title="fibonacci.js"
            showLineNumbers
            allowExecution
            showCopyButton
          />
        </section>

        {/* Python Example */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Python Snippet</h2>
          <CodeSnippetRenderer
            code={EXAMPLE_PYTHON}
            language="python"
            title="factorial.py"
            showLineNumbers
            allowExecution={false}
            showCopyButton
          />
        </section>

        {/* SQL Example */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">SQL Query</h2>
          <CodeSnippetRenderer
            code={EXAMPLE_SQL}
            language="sql"
            title="top_users_query.sql"
            showLineNumbers
            allowExecution={false}
            showCopyButton
          />
        </section>

        {/* HTML Example */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">HTML Document</h2>
          <CodeSnippetRenderer
            code={EXAMPLE_HTML}
            language="html"
            title="index.html"
            showLineNumbers
            showCopyButton
          />
        </section>

        {/* Markdown Parser Example */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Markdown Code Block Support</h2>
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <CodeBlockParser
              content={MARKDOWN_CONTENT}
              allowExecution={true}
            />
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-2">✓ Syntax Highlighting</h3>
              <p className="text-gray-400 text-sm">
                Support for 180+ languages using highlight.js with atom-one-dark theme
              </p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-2">✓ Copy Button</h3>
              <p className="text-gray-400 text-sm">
                One-click copy to clipboard with visual feedback
              </p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-2">✓ Code Execution</h3>
              <p className="text-gray-400 text-sm">
                Execute JavaScript code directly with output capture (no security risk)
              </p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-2">✓ Line Numbers</h3>
              <p className="text-gray-400 text-sm">
                Optional line numbers for easy reference
              </p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-2">✓ Markdown Support</h3>
              <p className="text-gray-400 text-sm">
                CodeBlockParser for seamless markdown integration
              </p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-2">✓ Responsive Design</h3>
              <p className="text-gray-400 text-sm">
                Mobile-friendly with horizontal scrolling for long lines
              </p>
            </div>
          </div>
        </section>

        {/* Usage Guide */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Usage Guide</h2>
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 space-y-4">
            <div>
              <h3 className="font-semibold text-white mb-2">Basic Usage:</h3>
              <pre className="bg-gray-800 p-3 rounded text-sm text-gray-300 overflow-x-auto">
{`import CodeSnippetRenderer from '@/components/CodeSnippetRenderer';

<CodeSnippetRenderer
  code="console.log('Hello, World!');"
  language="javascript"
  title="hello.js"
  allowExecution
/>`}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Markdown Integration:</h3>
              <pre className="bg-gray-800 p-3 rounded text-sm text-gray-300 overflow-x-auto">
{`import CodeBlockParser from '@/components/CodeBlockParser';

const content = \`# My Guide
\\\`\\\`\\\`javascript
console.log('Code here');
\\\`\\\`\\\`
\`;

<CodeBlockParser content={content} allowExecution={true} />`}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Supported Props:</h3>
              <ul className="list-disc list-inside text-gray-400 space-y-1">
                <li><code className="bg-gray-800 px-2 py-1 rounded text-sm">code</code> (required): Code string</li>
                <li><code className="bg-gray-800 px-2 py-1 rounded text-sm">language</code>: Programming language (default: javascript)</li>
                <li><code className="bg-gray-800 px-2 py-1 rounded text-sm">title</code>: Optional filename/title</li>
                <li><code className="bg-gray-800 px-2 py-1 rounded text-sm">showLineNumbers</code>: Toggle line numbers (default: true)</li>
                <li><code className="bg-gray-800 px-2 py-1 rounded text-sm">allowExecution</code>: Enable run button for JS (default: false)</li>
                <li><code className="bg-gray-800 px-2 py-1 rounded text-sm">showCopyButton</code>: Toggle copy button (default: true)</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
