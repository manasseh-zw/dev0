import {
  HeadContent,
  Scripts,
  createRootRoute,
  Link,
  useRouterState,
} from '@tanstack/react-router'

import appCss from '@/styles.css?url'
import { ThemeProvider } from '@/components/theme-provider'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'dev0',
      },
      {
        name: 'apple-mobile-web-app-title',
        content: 'dev0',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/png',
        href: '/favicon-96x96.png',
        sizes: '96x96',
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/favicon.svg',
      },
      {
        rel: 'shortcut icon',
        href: '/favicon.ico',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'manifest',
        href: '/site.webmanifest',
      },
    ],
  }),

  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>

        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-center px-6">
      <p className="text-sm text-muted-foreground">Route not found</p>
      <p className="text-sm text-muted-foreground">Path: {pathname}</p>
      <Link to="/" className="text-sm text-primary hover:underline">
        Go to home
      </Link>
    </div>
  )
}
