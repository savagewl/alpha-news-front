import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, GuestOnly, RequireAuth } from './auth/AuthProvider'
import AppLayout from './layout/AppLayout'
import AuthLayout from './layout/AuthLayout'
import CompaniesPage from './pages/CompaniesPage'
import DigestPage from './pages/DigestPage'
import EventPage from './pages/EventPage'
import HomePage from './pages/HomePage'
import HowPage from './pages/HowPage'
import LoginPage from './pages/LoginPage'
import MapPage from './pages/MapPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import SavedPage from './pages/SavedPage'
import SecurityPage from './pages/SecurityPage'
import SourcesPage from './pages/SourcesPage'
import StatesPage from './pages/StatesPage'
import TracePage from './pages/TracePage'
import { WorkspaceProvider } from './state/workspace'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkspaceProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<GuestOnly />}>
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                </Route>
              </Route>
              <Route element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/companies" element={<CompaniesPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/digest" element={<DigestPage />} />
                  <Route path="/events/:eventId" element={<EventPage />} />
                  <Route path="/sources/:eventId?" element={<SourcesPage />} />
                  <Route path="/trace/:eventId?" element={<TracePage />} />
                  <Route path="/saved" element={<SavedPage />} />
                  <Route path="/how" element={<HowPage />} />
                  <Route path="/security" element={<SecurityPage />} />
                  <Route path="/states" element={<StatesPage />} />
                  <Route path="/map" element={<MapPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
