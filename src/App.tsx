import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
// BackNavigation is now integrated into the Header component
import ProtectedRoute from "./components/ProtectedRoute";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load all dashboard pages for faster initial load
const StudentRegistration = lazy(() => import("./pages/StudentRegistration"));
const DoctorRegistration = lazy(() => import("./pages/DoctorRegistration"));
const MentorRegistration = lazy(() => import("./pages/MentorRegistration"));
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard"));
const DoctorProfile = lazy(() => import("./pages/DoctorProfile"));
const StudentProfilePage = lazy(() => import("./pages/StudentProfilePage"));
const MedicalTeam = lazy(() => import("./pages/MedicalTeam"));
const Appointments = lazy(() => import("./pages/Appointments"));
const MyAppointments = lazy(() => import("./pages/MyAppointments"));
const EmailConfirmation = lazy(() => import("./pages/EmailConfirmation"));
const HealthDashboard = lazy(() => import("./pages/HealthDashboard"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const NewVisit = lazy(() => import("./pages/NewVisit"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AdminHome = lazy(() => import("./pages/AdminHome"));
const MentorDashboard = lazy(() => import("./pages/MentorDashboard"));
const MentorHome = lazy(() => import("./pages/MentorHome"));
const MentorProfile = lazy(() => import("./pages/MentorProfile"));
const MedicalLeave = lazy(() => import("./pages/MedicalLeave"));
const PharmacyDashboard = lazy(() => import("./pages/PharmacyDashboard"));
const LabOfficerDashboard = lazy(() => import("./pages/LabOfficerDashboard"));
const MedicalStaffDashboard = lazy(() => import("./pages/MedicalStaffDashboard"));
const MedicalStaffHome = lazy(() => import("./pages/MedicalStaffHome"));
const EmergencyPage = lazy(() => import("./pages/EmergencyPage"));

const PageLoader = () => (
  <div className="min-h-screen bg-background">
    <div className="h-[72px] border-b border-border bg-card/95 flex items-center px-4 gap-4">
      <Skeleton className="w-14 h-14 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds stale time
      gcTime: 5 * 60 * 1000, // 5 min garbage collection
      retry: 1,
      refetchOnWindowFocus: true,
      refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
      refetchIntervalInBackground: false, // Pause when tab is not active
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* BackNavigation integrated into Header */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/email-confirmation" element={<EmailConfirmation />} />
            <Route path="/medical-team" element={<MedicalTeam />} />
            
            {/* Protected Routes */}
            <Route path="/student/register" element={<ProtectedRoute><StudentRegistration /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute><StudentProfilePage /></ProtectedRoute>} />
            <Route path="/doctor/register" element={<ProtectedRoute><DoctorRegistration /></ProtectedRoute>} />
            <Route path="/doctor/dashboard" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
            <Route path="/doctor/profile" element={<ProtectedRoute><DoctorProfile /></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
            <Route path="/my-appointments" element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />
            <Route path="/health-dashboard" element={<ProtectedRoute><HealthDashboard /></ProtectedRoute>} />
            <Route path="/student-profile/:rollNumber" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
            <Route path="/new-visit" element={<ProtectedRoute><NewVisit /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminHome /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            <Route path="/mentor/home" element={<ProtectedRoute><MentorHome /></ProtectedRoute>} />
            <Route path="/mentor/register" element={<ProtectedRoute><MentorRegistration /></ProtectedRoute>} />
            <Route path="/mentor/dashboard" element={<ProtectedRoute><MentorDashboard /></ProtectedRoute>} />
            <Route path="/mentor/profile" element={<ProtectedRoute><MentorProfile /></ProtectedRoute>} />
            <Route path="/medical-leave" element={<ProtectedRoute><MedicalLeave /></ProtectedRoute>} />
            <Route path="/emergency" element={<ProtectedRoute><EmergencyPage /></ProtectedRoute>} />
            
            {/* Staff Dashboards */}
            <Route path="/pharmacy/dashboard" element={<ProtectedRoute><PharmacyDashboard /></ProtectedRoute>} />
            <Route path="/lab/dashboard" element={<ProtectedRoute><LabOfficerDashboard /></ProtectedRoute>} />
            <Route path="/staff/home" element={<ProtectedRoute><MedicalStaffHome /></ProtectedRoute>} />
            <Route path="/staff/dashboard" element={<ProtectedRoute><MedicalStaffDashboard /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
