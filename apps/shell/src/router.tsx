import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from './routes/AppLayout';
import { LoginPage } from './routes/LoginPage';
import { PlatformPage } from './routes/PlatformPage';
import { ReviewPage } from './routes/ReviewPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/review" replace /> },
      // One route with an optional segment, so the list remote is not remounted
      // when a document is opened.
      { path: 'review/:documentId?', element: <ReviewPage /> },
      { path: 'platform', element: <PlatformPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/review" replace /> },
]);
