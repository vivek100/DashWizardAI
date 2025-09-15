import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { LoginPage } from '@/components/auth/LoginPage';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/components/home/HomePage';
import { DataPage } from '@/components/data/DataPage';
import { DashboardsPage } from '@/components/dashboards/DashboardsPage';
import { DashboardEditor } from '@/components/dashboards/DashboardEditor';
import { DashboardViewer } from '@/components/dashboards/DashboardViewer';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const { isAuthenticated } = useAuthStore();
  const { initializeStore } = useDashboardStore();

  // Initialize dashboard store with lazy sync
  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  return (
    <>
      <Router>
        {!isAuthenticated ? (
          <LoginPage />
        ) : (
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="data" element={<DataPage />} />
              <Route path="dashboards" element={<DashboardsPage />} />
              <Route path="settings" element={<div>Settings Page</div>} />
            </Route>
            <Route path="/dashboards/edit/:id" element={<DashboardEditor />} />
            <Route path="/dashboards/view/:id" element={<DashboardViewer />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </Router>
      <Toaster />
    </>
  );
}

export default App;