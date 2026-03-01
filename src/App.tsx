import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import StudentRegistration from "./pages/StudentRegistration";
import DoctorRegistration from "./pages/DoctorRegistration";
import MentorRegistration from "./pages/MentorRegistration";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorProfile from "./pages/DoctorProfile";
import StudentProfilePage from "./pages/StudentProfilePage";
import MedicalTeam from "./pages/MedicalTeam";
import Appointments from "./pages/Appointments";
import MyAppointments from "./pages/MyAppointments";
import Auth from "./pages/Auth";
import EmailConfirmation from "./pages/EmailConfirmation";
import HealthDashboard from "./pages/HealthDashboard";
import StudentProfile from "./pages/StudentProfile";
import NewVisit from "./pages/NewVisit";
import AdminPanel from "./pages/AdminPanel";
import MentorDashboard from "./pages/MentorDashboard";
import MentorProfile from "./pages/MentorProfile";
import MedicalLeave from "./pages/MedicalLeave";
import PharmacyDashboard from "./pages/PharmacyDashboard";
import LabOfficerDashboard from "./pages/LabOfficerDashboard";
import MedicalStaffDashboard from "./pages/MedicalStaffDashboard";
import NotFound from "./pages/NotFound";
import BackNavigation from "./components/BackNavigation";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <BackNavigation />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/email-confirmation" element={<EmailConfirmation />} />
          <Route path="/medical-team" element={<MedicalTeam />} />
          
          {/* Protected Routes - Require Login */}
          <Route path="/student/register" element={
            <ProtectedRoute><StudentRegistration /></ProtectedRoute>
          } />
          <Route path="/student/profile" element={
            <ProtectedRoute><StudentProfilePage /></ProtectedRoute>
          } />
          <Route path="/doctor/register" element={
            <ProtectedRoute><DoctorRegistration /></ProtectedRoute>
          } />
          <Route path="/doctor/dashboard" element={
            <ProtectedRoute><DoctorDashboard /></ProtectedRoute>
          } />
          <Route path="/doctor/profile" element={
            <ProtectedRoute><DoctorProfile /></ProtectedRoute>
          } />
          <Route path="/appointments" element={
            <ProtectedRoute><Appointments /></ProtectedRoute>
          } />
          <Route path="/my-appointments" element={
            <ProtectedRoute><MyAppointments /></ProtectedRoute>
          } />
          <Route path="/health-dashboard" element={
            <ProtectedRoute><HealthDashboard /></ProtectedRoute>
          } />
          <Route path="/student-profile/:rollNumber" element={
            <ProtectedRoute><StudentProfile /></ProtectedRoute>
          } />
          <Route path="/new-visit" element={
            <ProtectedRoute><NewVisit /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute><AdminPanel /></ProtectedRoute>
          } />
          <Route path="/mentor/register" element={
            <ProtectedRoute><MentorRegistration /></ProtectedRoute>
          } />
          <Route path="/mentor/dashboard" element={
            <ProtectedRoute><MentorDashboard /></ProtectedRoute>
          } />
          <Route path="/mentor/profile" element={
            <ProtectedRoute><MentorProfile /></ProtectedRoute>
          } />
          <Route path="/medical-leave" element={
            <ProtectedRoute><MedicalLeave /></ProtectedRoute>
          } />
          
          {/* Staff Dashboards */}
          <Route path="/pharmacy/dashboard" element={
            <ProtectedRoute><PharmacyDashboard /></ProtectedRoute>
          } />
          <Route path="/lab/dashboard" element={
            <ProtectedRoute><LabOfficerDashboard /></ProtectedRoute>
          } />
          <Route path="/staff/dashboard" element={
            <ProtectedRoute><MedicalStaffDashboard /></ProtectedRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
