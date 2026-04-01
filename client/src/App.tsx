import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/components/shared/RoleGuard';
import { ModuleGuard } from '@/components/shared/ModuleGuard';
import { useAuth } from '@/hooks/useAuth';
import { ErrorBoundary, PageErrorBoundary } from '@/components/ui/ErrorBoundary';

// Auth pages (not lazy — needed immediately)
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForceResetPasswordPage } from '@/pages/auth/ForceResetPasswordPage';

// Lazy-loaded pages
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ClientsListPage = lazy(() => import('@/pages/clients/ClientsListPage').then(m => ({ default: m.ClientsListPage })));
const ClientCreatePage = lazy(() => import('@/pages/clients/ClientCreatePage').then(m => ({ default: m.ClientCreatePage })));
const ClientDetailPage = lazy(() => import('@/pages/clients/ClientDetailPage').then(m => ({ default: m.ClientDetailPage })));

// Client area
const OverviewPage = lazy(() => import('@/pages/client-area/OverviewPage').then(m => ({ default: m.OverviewPage })));
const ChurnInfoPage = lazy(() => import('@/pages/client-area/ChurnInfoPage').then(m => ({ default: m.ChurnInfoPage })));
const MeetingsPage = lazy(() => import('@/pages/client-area/MeetingsPage').then(m => ({ default: m.MeetingsPage })));
const StrategyPage = lazy(() => import('@/pages/client-area/StrategyPage').then(m => ({ default: m.StrategyPage })));
const SummaryPage = lazy(() => import('@/pages/client-area/SummaryPage').then(m => ({ default: m.SummaryPage })));
const CohortsPage = lazy(() => import('@/pages/client-area/CohortsPage').then(m => ({ default: m.CohortsPage })));
const EditorialPage = lazy(() => import('@/pages/client-area/EditorialPage').then(m => ({ default: m.EditorialPage })));
const BriefingsPage = lazy(() => import('@/pages/client-area/BriefingsPage').then(m => ({ default: m.BriefingsPage })));
const ReportsPage = lazy(() => import('@/pages/client-area/ReportsPage').then(m => ({ default: m.ReportsPage })));
const BIPage = lazy(() => import('@/pages/client-area/BIPage').then(m => ({ default: m.BIPage })));
const SystemsPage = lazy(() => import('@/pages/client-area/SystemsPage').then(m => ({ default: m.SystemsPage })));

// Management pages
const CRMPage = lazy(() => import('@/pages/crm/CRMPage').then(m => ({ default: m.CRMPage })));
const CoordinatorCRMPage = lazy(() => import('@/pages/coordinator/CoordinatorCRMPage').then(m => ({ default: m.CoordinatorCRMPage })));
const CoordinatorClientsPage = lazy(() => import('@/pages/coordinator/CoordinatorClientsPage').then(m => ({ default: m.CoordinatorClientsPage })));
const CoordinatorTriosPage = lazy(() => import('@/pages/coordinator/CoordinatorTriosPage').then(m => ({ default: m.CoordinatorTriosPage })));
const BoardOfHeadPage = lazy(() => import('@/pages/coordinator/BoardOfHeadPage').then(m => ({ default: m.BoardOfHeadPage })));
const SprintPage = lazy(() => import('@/pages/coordinator/SprintPage').then(m => ({ default: m.SprintPage })));
const UsersPage = lazy(() => import('@/pages/users/UsersPage').then(m => ({ default: m.UsersPage })));
const BackupPage = lazy(() => import('@/pages/backup/BackupPage').then(m => ({ default: m.BackupPage })));

// Commercial module (exclusive: Bruna Moreira)
const CommercialDashboardPage = lazy(() => import('@/pages/commercial/CommercialDashboardPage').then(m => ({ default: m.CommercialDashboardPage })));
const MonetizationsPage = lazy(() => import('@/pages/commercial/MonetizationsPage').then(m => ({ default: m.MonetizationsPage })));
const CommissionsPage = lazy(() => import('@/pages/commercial/CommissionsPage').then(m => ({ default: m.CommissionsPage })));
const GoalsPage = lazy(() => import('@/pages/commercial/GoalsPage').then(m => ({ default: m.GoalsPage })));

// Handoff wizard (aquisição)
const HandoffWizardPage = lazy(() => import('@/pages/handoff/HandoffWizardPage').then(m => ({ default: m.HandoffWizardPage })));

// Global pages
const GlobalBIPage = lazy(() => import('@/pages/bi/GlobalBIPage').then(m => ({ default: m.GlobalBIPage })));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));

// Redirect aquisição to handoff wizard, others to dashboard
function DashboardRedirect() {
  const { user } = useAuth();
  if (user?.role === 'aquisicao') {
    return <Navigate to="/handoffs/new" replace />;
  }
  return <DashboardPage />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-deep">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Wraps each lazy page in its own ErrorBoundary so one broken page
// doesn't take down the whole app.
function Page({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

export default function App() {
  return (
    <PageErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-bg-deep">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ForceResetPasswordPage />} />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Page><DashboardRedirect /></Page>} />

                    {/* CRM — Leadership + Super Admin */}
                    <Route
                      path="/crm"
                      element={
                        <Page>
                          <RoleGuard allowedRoles={['super_admin', 'lideranca']}>
                            <CRMPage />
                          </RoleGuard>
                        </Page>
                      }
                    />
                    <Route
                      path="/coordinator-crm"
                      element={
                        <Page>
                          <RoleGuard allowedRoles={['super_admin', 'coordenador']}>
                            <CoordinatorCRMPage />
                          </RoleGuard>
                        </Page>
                      }
                    />

                    {/* Coordinator Clients */}
                    <Route
                      path="/coordinator/clients"
                      element={
                        <Page>
                          <RoleGuard allowedRoles={['super_admin', 'coordenador']}>
                            <CoordinatorClientsPage />
                          </RoleGuard>
                        </Page>
                      }
                    />

                    {/* Coordinator Trios */}
                    <Route
                      path="/coordinator/trios"
                      element={
                        <Page>
                          <RoleGuard allowedRoles={['super_admin', 'coordenador']}>
                            <CoordinatorTriosPage />
                          </RoleGuard>
                        </Page>
                      }
                    />

                    {/* Board Of Head */}
                    <Route
                      path="/coordinator/board-of-head"
                      element={
                        <Page>
                          <RoleGuard allowedRoles={['super_admin', 'coordenador', 'account', 'designer', 'gestor_trafego', 'tech_crm']}>
                            <BoardOfHeadPage />
                          </RoleGuard>
                        </Page>
                      }
                    />

                    {/* Sprint */}
                    <Route
                      path="/coordinator/sprint"
                      element={
                        <Page>
                          <RoleGuard allowedRoles={['super_admin', 'coordenador']}>
                            <SprintPage />
                          </RoleGuard>
                        </Page>
                      }
                    />

                    {/* Handoff Wizard — Aquisição + Super Admin */}
                    <Route
                      path="/handoffs/new"
                      element={
                        <Page>
                          <RoleGuard allowedRoles={['super_admin', 'aquisicao']}>
                            <HandoffWizardPage />
                          </RoleGuard>
                        </Page>
                      }
                    />

                    {/* User Management — Leadership + Super Admin */}
                    <Route
                      path="/users"
                      element={
                        <Page>
                          <RoleGuard allowedRoles={['super_admin', 'lideranca']}>
                            <UsersPage />
                          </RoleGuard>
                        </Page>
                      }
                    />
                    <Route
                      path="/backup"
                      element={
                        <Page>
                          <RoleGuard allowedRoles={['super_admin', 'lideranca']}>
                            <BackupPage />
                          </RoleGuard>
                        </Page>
                      }
                    />

                    {/* Clients */}
                    <Route path="/clients" element={<Page><ClientsListPage /></Page>} />
                    <Route path="/clients/new" element={<Page><ClientCreatePage /></Page>} />
                    <Route path="/clients/:clientId" element={<Navigate to="overview" replace />} />

                    {/* Client Area */}
                    <Route path="/clients/:clientId/churn-info" element={<Page><ChurnInfoPage /></Page>} />
                    <Route path="/clients/:clientId/overview" element={<Page><OverviewPage /></Page>} />
                    <Route path="/clients/:clientId/meetings" element={<Page><MeetingsPage /></Page>} />
                    <Route path="/clients/:clientId/strategy" element={<Page><StrategyPage /></Page>} />
                    <Route path="/clients/:clientId/summary" element={<Page><SummaryPage /></Page>} />
                    <Route path="/clients/:clientId/cohorts" element={<Page><CohortsPage /></Page>} />
                    <Route path="/clients/:clientId/editorial" element={<Page><EditorialPage /></Page>} />
                    <Route path="/clients/:clientId/briefings" element={<Page><BriefingsPage /></Page>} />
                    <Route path="/clients/:clientId/reports" element={<Page><ReportsPage /></Page>} />
                    <Route path="/clients/:clientId/bi" element={<Page><BIPage /></Page>} />
                    <Route path="/clients/:clientId/systems" element={<Page><SystemsPage /></Page>} />

                    {/* Global */}
                    <Route path="/bi" element={<Page><GlobalBIPage /></Page>} />
                    <Route
                      path="/settings"
                      element={
                        <Page>
                          <RoleGuard allowedRoles={['super_admin']}>
                            <SettingsPage />
                          </RoleGuard>
                        </Page>
                      }
                    />

                    {/* Commercial module — exclusive to users with 'commercial' module */}
                    <Route
                      path="/commercial"
                      element={
                        <Page>
                          <ModuleGuard module="commercial">
                            <CommercialDashboardPage />
                          </ModuleGuard>
                        </Page>
                      }
                    />
                    <Route
                      path="/commercial/monetizations"
                      element={
                        <Page>
                          <ModuleGuard module="commercial">
                            <MonetizationsPage />
                          </ModuleGuard>
                        </Page>
                      }
                    />
                    <Route
                      path="/commercial/commissions"
                      element={
                        <Page>
                          <ModuleGuard module="commercial">
                            <CommissionsPage />
                          </ModuleGuard>
                        </Page>
                      }
                    />
                    <Route
                      path="/commercial/goals"
                      element={
                        <Page>
                          <ModuleGuard module="commercial">
                            <GoalsPage />
                          </ModuleGuard>
                        </Page>
                      }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </AppShell>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </PageErrorBoundary>
  );
}
