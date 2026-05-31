import { type ReactNode } from "react";
import { TopBar } from "./top-bar";

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-transparent">
      <TopBar />
      <main className="px-4 pb-8 pt-6 lg:px-8 lg:pb-10 lg:pt-8">
        <div className="mx-auto w-full max-w-[1220px]">{children}</div>
      </main>
    </div>
  );
}
