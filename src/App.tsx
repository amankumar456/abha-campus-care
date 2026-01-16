import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import StudentRegistration from "./pages/StudentRegistration";
import DoctorRegistration from "./pages/DoctorRegistration";
import DoctorDashboard from "./pages/DoctorDashboard";
import MedicalTeam from "./pages/MedicalTeam";
import Appointments from "./pages/Appointments";
import MyAppointments from "./pages/MyAppointments";
import Auth from "./pages/Auth";
import EmailConfirmation from "./pages/EmailConfirmation";
import HealthDashboard from "./pages/HealthDashboard";
import StudentProfile from "./pages/StudentProfile";
import NewVisit from "./pages/NewVisit";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import BackNavigation from "./components/BackNavigation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <BackNavigation />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/email-confirmation" element={<EmailConfirmation />} />
          <Route path="/student/register" element={<StudentRegistration />} />
          <Route path="/doctor/register" element={<DoctorRegistration />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/medical-team" element={<MedicalTeam />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/my-appointments" element={<MyAppointments />} />
          <Route path="/health-dashboard" element={<HealthDashboard />} />
          <Route path="/student-profile/:rollNumber" element={<StudentProfile />} />
          <Route path="/new-visit" element={<NewVisit />} />
          <Route path="/admin" element={<AdminPanel />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
