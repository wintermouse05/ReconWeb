// client/src/App.jsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ScanHistoryPage from './pages/ScanHistoryPage';
import ScanDetailsPage from './pages/ScanDetailsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import CodeReviewPage from './pages/CodeReviewPage';
import AboutPage from './pages/AboutPage';
import ProfilePage from './pages/ProfilePage';  // ← New
import SettingsPage from './pages/SettingsPage';  // ← New

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
       
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="history" element={<ScanHistoryPage />} />
          <Route path="scans/:id" element={<ScanDetailsPage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="code-review" element={<CodeReviewPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="profile" element={<ProfilePage />} />  {/* ← New */}
          <Route path="settings" element={<SettingsPage />} />  {/* ← New */}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;