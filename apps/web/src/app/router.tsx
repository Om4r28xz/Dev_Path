import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AppLayout } from '../components/layout/AppLayout.js';
import { RegisterPage } from '../features/auth/pages/RegisterPage.js';
import { LoginPage } from '../features/auth/pages/LoginPage.js';
import { ProfilePage } from '../features/profile/pages/ProfilePage.js';
import { NewAnalysisPage } from '../features/analyses/pages/NewAnalysisPage.js';
import { AnalysesListPage } from '../features/analyses/pages/AnalysesListPage.js';
import { AnalysisDetailPage } from '../features/analyses/pages/AnalysisDetailPage.js';
import { NotFoundPage } from './NotFoundPage.js';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/analysis/new" element={<NewAnalysisPage />} />
          <Route path="/analyses" element={<AnalysesListPage />} />
          <Route path="/analyses/:id" element={<AnalysisDetailPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
