"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Crumb = { label: string; href?: string };
type HeaderState = { title?: string; crumbs?: Crumb[] };

const PageHeaderContext = createContext<{
  state: HeaderState;
  setState: (state: HeaderState) => void;
} | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HeaderState>({});
  return (
    <PageHeaderContext.Provider value={{ state, setState }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function useHeaderState() {
  return useContext(PageHeaderContext)?.state ?? {};
}

// Lets a page replace the header title (or show breadcrumbs) while mounted,
// e.g. "Khoá học của tôi › Toán 10" on course detail.
export function usePageHeader(title?: string, crumbs?: Crumb[]) {
  const setState = useContext(PageHeaderContext)?.setState;
  const crumbsKey = crumbs ? JSON.stringify(crumbs) : "";

  useEffect(() => {
    if (!setState || (!title && !crumbsKey)) return;
    setState({
      title,
      crumbs: crumbsKey ? (JSON.parse(crumbsKey) as Crumb[]) : undefined,
    });
    return () => setState({});
  }, [setState, title, crumbsKey]);
}
