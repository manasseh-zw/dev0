import type { ReviewPRFile } from '@/lib/types/review'
import { MOCK_TASK_IDS } from './tasks'

// Mock PR files for tasks that have PRs
// Each file includes a patch in unified diff format
export const mockPRFiles: Record<string, ReviewPRFile[]> = {
  [MOCK_TASK_IDS.projectSetup]: [
    {
      filename: 'package.json',
      status: 'added',
      additions: 45,
      deletions: 0,
      changes: 45,
      sha: 'abc123def456',
      patch: `@@ -0,0 +1,45 @@
+{
+  "name": "devportfolio",
+  "private": true,
+  "type": "module",
+  "scripts": {
+    "dev": "vite dev --port 3000",
+    "build": "vite build",
+    "preview": "vite preview",
+    "test": "vitest run",
+    "format": "prettier --write ."
+  },
+  "dependencies": {
+    "@tanstack/react-router": "^1.132.0",
+    "@tanstack/react-start": "^1.132.0",
+    "react": "^19.2.0",
+    "react-dom": "^19.2.0",
+    "tailwindcss": "^4.0.6",
+    "class-variance-authority": "^0.7.1",
+    "clsx": "^2.1.1",
+    "tailwind-merge": "^3.4.0"
+  },
+  "devDependencies": {
+    "@types/react": "^19.2.0",
+    "@types/react-dom": "^19.2.0",
+    "typescript": "^5.7.2",
+    "vite": "^7.1.7",
+    "prettier": "^3.5.3"
+  }
+}`,
      previousFilename: null,
    },
    {
      filename: 'tsconfig.json',
      status: 'added',
      additions: 28,
      deletions: 0,
      changes: 28,
      sha: 'def789ghi012',
      patch: `@@ -0,0 +1,28 @@
+{
+  "compilerOptions": {
+    "target": "ES2022",
+    "lib": ["ES2022", "DOM", "DOM.Iterable"],
+    "module": "ESNext",
+    "moduleResolution": "bundler",
+    "strict": true,
+    "noEmit": true,
+    "jsx": "react-jsx",
+    "esModuleInterop": true,
+    "skipLibCheck": true,
+    "forceConsistentCasingInFileNames": true,
+    "baseUrl": ".",
+    "paths": {
+      "@/*": ["./src/*"]
+    }
+  },
+  "include": ["src/**/*"],
+  "exclude": ["node_modules"]
+}`,
      previousFilename: null,
    },
    {
      filename: 'src/routes/__root.tsx',
      status: 'added',
      additions: 32,
      deletions: 0,
      changes: 32,
      sha: 'ghi345jkl678',
      patch: `@@ -0,0 +1,32 @@
+import { createRootRoute, Outlet } from '@tanstack/react-router'
+import { ThemeProvider } from 'next-themes'
+
+export const Route = createRootRoute({
+  component: RootComponent,
+})
+
+function RootComponent() {
+  return (
+    <ThemeProvider
+      attribute="class"
+      defaultTheme="system"
+      enableSystem
+      disableTransitionOnChange
+    >
+      <div className="min-h-screen bg-background text-foreground">
+        <Outlet />
+      </div>
+    </ThemeProvider>
+  )
+}`,
      previousFilename: null,
    },
  ],

  [MOCK_TASK_IDS.designSystem]: [
    {
      filename: 'src/styles/globals.css',
      status: 'modified',
      additions: 56,
      deletions: 8,
      changes: 64,
      sha: 'jkl901mno234',
      patch: `@@ -1,8 +1,56 @@
-@tailwind base;
-@tailwind components;
-@tailwind utilities;
-
-body {
-  margin: 0;
-  padding: 0;
-}
+@import "tailwindcss";
+
+@theme {
+  --color-background: var(--background);
+  --color-foreground: var(--foreground);
+  --color-primary: var(--primary);
+  --color-secondary: var(--secondary);
+  --color-muted: var(--muted);
+  --color-accent: var(--accent);
+  --color-border: var(--border);
+}
+
+:root {
+  --background: 0 0% 100%;
+  --foreground: 240 10% 3.9%;
+  --primary: 240 5.9% 10%;
+  --primary-foreground: 0 0% 98%;
+  --secondary: 240 4.8% 95.9%;
+  --secondary-foreground: 240 5.9% 10%;
+  --muted: 240 4.8% 95.9%;
+  --muted-foreground: 240 3.8% 46.1%;
+  --accent: 240 4.8% 95.9%;
+  --accent-foreground: 240 5.9% 10%;
+  --border: 240 5.9% 90%;
+  --ring: 240 5.9% 10%;
+  --radius: 0.5rem;
+}
+
+.dark {
+  --background: 240 10% 3.9%;
+  --foreground: 0 0% 98%;
+  --primary: 0 0% 98%;
+  --primary-foreground: 240 5.9% 10%;
+  --secondary: 240 3.7% 15.9%;
+  --secondary-foreground: 0 0% 98%;
+  --muted: 240 3.7% 15.9%;
+  --muted-foreground: 240 5% 64.9%;
+  --accent: 240 3.7% 15.9%;
+  --accent-foreground: 0 0% 98%;
+  --border: 240 3.7% 15.9%;
+  --ring: 240 4.9% 83.9%;
+}
+
+* {
+  border-color: hsl(var(--border));
+}
+
+body {
+  background-color: hsl(var(--background));
+  color: hsl(var(--foreground));
+}`,
      previousFilename: null,
    },
    {
      filename: 'src/lib/utils.ts',
      status: 'added',
      additions: 12,
      deletions: 0,
      changes: 12,
      sha: 'mno567pqr890',
      patch: `@@ -0,0 +1,12 @@
+import { type ClassValue, clsx } from 'clsx'
+import { twMerge } from 'tailwind-merge'
+
+export function cn(...inputs: ClassValue[]) {
+  return twMerge(clsx(inputs))
+}
+
+export function formatDate(date: Date | string): string {
+  return new Intl.DateTimeFormat('en-US', {
+    dateStyle: 'medium',
+  }).format(new Date(date))
+}`,
      previousFilename: null,
    },
  ],

  [MOCK_TASK_IDS.layoutComponents]: [
    {
      filename: 'src/components/layout/header.tsx',
      status: 'added',
      additions: 68,
      deletions: 0,
      changes: 68,
      sha: 'pqr123stu456',
      patch: `@@ -0,0 +1,68 @@
+import { Link } from '@tanstack/react-router'
+import { cn } from '@/lib/utils'
+import { ThemeToggle } from './theme-toggle'
+
+const navigation = [
+  { name: 'Home', href: '/' },
+  { name: 'About', href: '/about' },
+  { name: 'Projects', href: '/projects' },
+  { name: 'Blog', href: '/blog' },
+  { name: 'Contact', href: '/contact' },
+]
+
+interface HeaderProps {
+  className?: string
+}
+
+export function Header({ className }: HeaderProps) {
+  return (
+    <header
+      className={cn(
+        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
+        className
+      )}
+    >
+      <div className="container flex h-14 items-center">
+        <div className="mr-4 hidden md:flex">
+          <Link to="/" className="mr-6 flex items-center space-x-2">
+            <span className="hidden font-bold sm:inline-block">
+              DevPortfolio
+            </span>
+          </Link>
+          <nav className="flex items-center space-x-6 text-sm font-medium">
+            {navigation.map((item) => (
+              <Link
+                key={item.href}
+                to={item.href}
+                className="transition-colors hover:text-foreground/80 text-foreground/60"
+              >
+                {item.name}
+              </Link>
+            ))}
+          </nav>
+        </div>
+        <div className="flex flex-1 items-center justify-end space-x-2">
+          <ThemeToggle />
+        </div>
+      </div>
+    </header>
+  )
+}`,
      previousFilename: null,
    },
    {
      filename: 'src/components/layout/footer.tsx',
      status: 'added',
      additions: 42,
      deletions: 0,
      changes: 42,
      sha: 'stu789vwx012',
      patch: `@@ -0,0 +1,42 @@
+import { cn } from '@/lib/utils'
+
+interface FooterProps {
+  className?: string
+}
+
+export function Footer({ className }: FooterProps) {
+  const currentYear = new Date().getFullYear()
+
+  return (
+    <footer
+      className={cn(
+        'border-t py-6 md:py-8',
+        className
+      )}
+    >
+      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
+        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
+          Built with{' '}
+          <a
+            href="https://tanstack.com/start"
+            target="_blank"
+            rel="noreferrer"
+            className="font-medium underline underline-offset-4"
+          >
+            TanStack Start
+          </a>
+          . The source code is available on{' '}
+          <a
+            href="https://github.com"
+            target="_blank"
+            rel="noreferrer"
+            className="font-medium underline underline-offset-4"
+          >
+            GitHub
+          </a>
+          .
+        </p>
+        <p className="text-sm text-muted-foreground">
+          &copy; {currentYear} DevPortfolio. All rights reserved.
+        </p>
+      </div>
+    </footer>
+  )
+}`,
      previousFilename: null,
    },
    {
      filename: 'src/components/layout/theme-toggle.tsx',
      status: 'added',
      additions: 28,
      deletions: 0,
      changes: 28,
      sha: 'vwx345yza678',
      patch: `@@ -0,0 +1,28 @@
+import { useTheme } from 'next-themes'
+import { Button } from '@/components/ui/button'
+import { MoonIcon, SunIcon } from 'lucide-react'
+
+export function ThemeToggle() {
+  const { theme, setTheme } = useTheme()
+
+  return (
+    <Button
+      variant="ghost"
+      size="icon"
+      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
+    >
+      <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
+      <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
+      <span className="sr-only">Toggle theme</span>
+    </Button>
+  )
+}`,
      previousFilename: null,
    },
  ],

  [MOCK_TASK_IDS.aboutPage]: [
    {
      filename: 'src/routes/about.tsx',
      status: 'added',
      additions: 156,
      deletions: 0,
      changes: 156,
      sha: 'yza901bcd234',
      patch: `@@ -0,0 +1,156 @@
+import { createFileRoute } from '@tanstack/react-router'
+
+export const Route = createFileRoute('/about')({
+  component: AboutPage,
+})
+
+const skills = [
+  { name: 'React', level: 95 },
+  { name: 'TypeScript', level: 90 },
+  { name: 'Node.js', level: 85 },
+  { name: 'PostgreSQL', level: 80 },
+  { name: 'AWS', level: 75 },
+  { name: 'Docker', level: 70 },
+]
+
+const experience = [
+  {
+    title: 'Senior Software Engineer',
+    company: 'Tech Corp',
+    period: '2022 - Present',
+    description: 'Leading frontend architecture and mentoring junior developers.',
+  },
+  {
+    title: 'Software Engineer',
+    company: 'StartupXYZ',
+    period: '2020 - 2022',
+    description: 'Built scalable web applications using React and Node.js.',
+  },
+  {
+    title: 'Junior Developer',
+    company: 'WebAgency',
+    period: '2018 - 2020',
+    description: 'Developed responsive websites and maintained client projects.',
+  },
+]
+
+function AboutPage() {
+  return (
+    <div className="container py-12">
+      <div className="max-w-4xl mx-auto">
+        {/* Bio Section */}
+        <section className="mb-16">
+          <h1 className="text-4xl font-bold mb-6">About Me</h1>
+          <div className="prose dark:prose-invert max-w-none">
+            <p className="text-lg text-muted-foreground">
+              I'm a passionate software engineer with over 6 years of experience
+              building web applications. I specialize in React, TypeScript, and
+              Node.js, with a focus on creating performant and accessible user
+              interfaces.
+            </p>
+          </div>
+        </section>
+
+        {/* Skills Section */}
+        <section className="mb-16">
+          <h2 className="text-2xl font-semibold mb-6">Skills</h2>
+          <div className="grid gap-4">
+            {skills.map((skill) => (
+              <div key={skill.name} className="space-y-2">
+                <div className="flex justify-between text-sm">
+                  <span className="font-medium">{skill.name}</span>
+                  <span className="text-muted-foreground">{skill.level}%</span>
+                </div>
+                <div className="h-2 bg-muted rounded-full overflow-hidden">
+                  <div
+                    className="h-full bg-primary rounded-full transition-all"
+                    style={{ width: \`\${skill.level}%\` }}
+                  />
+                </div>
+              </div>
+            ))}
+          </div>
+        </section>
+
+        {/* Experience Section */}
+        <section>
+          <h2 className="text-2xl font-semibold mb-6">Experience</h2>
+          <div className="space-y-8">
+            {experience.map((job, index) => (
+              <div
+                key={index}
+                className="relative pl-8 border-l-2 border-muted pb-8 last:pb-0"
+              >
+                <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-primary" />
+                <div className="space-y-1">
+                  <h3 className="font-semibold">{job.title}</h3>
+                  <p className="text-sm text-muted-foreground">
+                    {job.company} &middot; {job.period}
+                  </p>
+                  <p className="text-sm">{job.description}</p>
+                </div>
+              </div>
+            ))}
+          </div>
+        </section>
+      </div>
+    </div>
+  )
+}`,
      previousFilename: null,
    },
    {
      filename: 'src/components/ui/progress.tsx',
      status: 'added',
      additions: 24,
      deletions: 0,
      changes: 24,
      sha: 'bcd567efg890',
      patch: `@@ -0,0 +1,24 @@
+import * as React from 'react'
+import { cn } from '@/lib/utils'
+
+interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
+  value?: number
+  max?: number
+}
+
+export function Progress({
+  className,
+  value = 0,
+  max = 100,
+  ...props
+}: ProgressProps) {
+  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
+
+  return (
+    <div
+      className={cn('h-2 bg-muted rounded-full overflow-hidden', className)}
+      {...props}
+    >
+      <div
+        className="h-full bg-primary rounded-full transition-all duration-300"
+        style={{ width: \`\${percentage}%\` }}
+      />
+    </div>
+  )
+}`,
      previousFilename: null,
    },
    {
      filename: 'src/components/about/skill-badge.tsx',
      status: 'added',
      additions: 18,
      deletions: 0,
      changes: 18,
      sha: 'efg123hij456',
      patch: `@@ -0,0 +1,18 @@
+import { cn } from '@/lib/utils'
+
+interface SkillBadgeProps {
+  name: string
+  className?: string
+}
+
+export function SkillBadge({ name, className }: SkillBadgeProps) {
+  return (
+    <span
+      className={cn(
+        'inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary',
+        className
+      )}
+    >
+      {name}
+    </span>
+  )
+}`,
      previousFilename: null,
    },
  ],

  [MOCK_TASK_IDS.heroSection]: [
    {
      filename: 'src/components/landing/hero.tsx',
      status: 'added',
      additions: 78,
      deletions: 0,
      changes: 78,
      sha: 'hij789klm012',
      patch: `@@ -0,0 +1,78 @@
+import { Link } from '@tanstack/react-router'
+import { Button } from '@/components/ui/button'
+import { motion } from 'motion/react'
+
+export function Hero() {
+  return (
+    <section className="relative min-h-[calc(100vh-4rem)] flex items-center">
+      <div className="container">
+        <div className="grid lg:grid-cols-2 gap-12 items-center">
+          {/* Text Content */}
+          <motion.div
+            initial={{ opacity: 0, y: 20 }}
+            animate={{ opacity: 1, y: 0 }}
+            transition={{ duration: 0.5 }}
+            className="space-y-6"
+          >
+            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
+              Hi, I'm{' '}
+              <span className="text-primary bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
+                John Developer
+              </span>
+            </h1>
+            <p className="text-xl text-muted-foreground max-w-lg">
+              A passionate software engineer specializing in building
+              exceptional digital experiences. Currently focused on creating
+              accessible, human-centered products.
+            </p>
+            <div className="flex flex-wrap gap-4">
+              <Button asChild size="lg">
+                <Link to="/projects">View My Work</Link>
+              </Button>
+              <Button asChild variant="outline" size="lg">
+                <Link to="/contact">Get In Touch</Link>
+              </Button>
+            </div>
+          </motion.div>
+
+          {/* Profile Image */}
+          <motion.div
+            initial={{ opacity: 0, scale: 0.95 }}
+            animate={{ opacity: 1, scale: 1 }}
+            transition={{ duration: 0.5, delay: 0.2 }}
+            className="relative hidden lg:block"
+          >
+            <div className="relative w-80 h-80 mx-auto">
+              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl" />
+              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary/10 to-background border-2 border-primary/20 flex items-center justify-center">
+                <span className="text-6xl">👨‍💻</span>
+              </div>
+            </div>
+          </motion.div>
+        </div>
+      </div>
+
+      {/* Background decoration */}
+      <div className="absolute inset-0 -z-10 overflow-hidden">
+        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
+        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
+      </div>
+    </section>
+  )
+}`,
      previousFilename: null,
    },
    {
      filename: 'src/routes/index.tsx',
      status: 'modified',
      additions: 12,
      deletions: 5,
      changes: 17,
      sha: 'klm345nop678',
      patch: `@@ -1,9 +1,16 @@
 import { createFileRoute } from '@tanstack/react-router'
+import { Hero } from '@/components/landing/hero'
+import { Header } from '@/components/layout/header'
+import { Footer } from '@/components/layout/footer'
 
 export const Route = createFileRoute('/')({
   component: HomePage,
 })
 
 function HomePage() {
-  return <div>Home Page</div>
+  return (
+    <>
+      <Header />
+      <main>
+        <Hero />
+      </main>
+      <Footer />
+    </>
+  )
 }`,
      previousFilename: null,
    },
  ],
}

/**
 * Get mock PR files for a task
 */
export function getMockPRFiles(taskId: string): ReviewPRFile[] {
  return mockPRFiles[taskId] ?? []
}

/**
 * Check if a task has mock PR files
 */
export function hasMockPRFiles(taskId: string): boolean {
  return taskId in mockPRFiles
}
