import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ClientSidebar } from './ClientSidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const pathname = location.pathname;

  // Show client sidebar when in a client sub-area (e.g. /clients/:id/overview, /clients/:id/meetings)
  const clientAreaMatch = pathname.match(/^\/clients\/[^/]+\/.+/);
  const isInClientArea = !!clientAreaMatch;


  return (
    <div className="min-h-screen flex bg-bg-deep">
      {/* Background mesh gradient */}
      <div className="fixed inset-0 bg-mesh-galaxy pointer-events-none -z-10" aria-hidden="true" />

      {/* Main Sidebar */}
      <Sidebar />

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <div className="flex flex-1 min-h-0">
          {/* Client-specific sidebar */}
          {isInClientArea && <ClientSidebar />}

          {/* Page content */}
          <main className="flex-1 overflow-auto p-6 relative z-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
