"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { PageHeaderProvider } from "./page-header";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

type Props = {
  children: ReactNode;
};

// Learning Player and Assessment Attempt run in focus mode: no app sidebar or
// header; the page renders its own top bar and outline/navigator.
const FOCUS_ROUTES = [/^\/courses\/\d+\/lessons\/\d+/, /^\/assessments\/\d+\/attempt/];

function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only z-50 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
    >
      Bỏ qua đến nội dung chính
    </a>
  );
}

// Desktop shell: 240px sidebar + header (bell, avatar) + scrolling content.
export function AppShell({ children }: Props) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);
  const focusMode = FOCUS_ROUTES.some((route) => route.test(pathname));

  // Client-side navigation keeps focus on the clicked link; move it to the
  // new page's content so keyboard and screen-reader users start there.
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    mainRef.current?.focus({ preventScroll: true });
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  if (focusMode) {
    return (
      <>
        <SkipLink />
        <main id="main-content" ref={mainRef} tabIndex={-1} className="h-dvh outline-none">
          {children}
        </main>
      </>
    );
  }

  return (
    <PageHeaderProvider>
      <div className="grid h-dvh grid-rows-[minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]">
        <SkipLink />
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-col">
          <TopBar />
          <main
            id="main-content"
            ref={mainRef}
            tabIndex={-1}
            className="flex-1 overflow-auto px-4 py-6 outline-none lg:px-8 lg:py-7"
          >
            {children}
          </main>
        </div>
      </div>
    </PageHeaderProvider>
  );
}
