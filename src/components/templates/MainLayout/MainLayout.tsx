import type { ReactNode } from "react";

interface MainLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

function MainLayout({ sidebar, children }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-white text-gray-900 dark:bg-slate-900 dark:text-white font-sans">
      {sidebar}
      <main className="flex-1 min-h-0 overflow-hidden bg-gray-50 dark:bg-slate-900">
        {children}
      </main>
    </div>
  );
}

export { MainLayout };
export type { MainLayoutProps };
