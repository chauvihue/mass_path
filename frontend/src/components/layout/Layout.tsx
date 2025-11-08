import { FC, ReactNode } from 'react';
import { Header } from './Header';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showNav?: boolean;
}

export const Layout: FC<LayoutProps> = ({
  children,
  title,
  showNav = true,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title={title} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      {showNav && <Navigation />}
    </div>
  );
};

