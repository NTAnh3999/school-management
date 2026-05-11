import { type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 pb-8 pt-5 lg:px-8 lg:pb-10 lg:pt-6">
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
