import { type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

type Props = {
  children: ReactNode;
};

// Desktop shell: 240px sidebar + header (bell, avatar) + scrolling content.
export function AppShell({ children }: Props) {
  return (
    <div className="grid h-screen grid-rows-[minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto px-4 py-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
