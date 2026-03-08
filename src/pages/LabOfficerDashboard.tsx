import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { format, startOfDay, isAfter } from "date-fns";
import LabSidebar from "@/components/lab/LabSidebar";
import LabOverview from "@/components/lab/LabOverview";
import LabProcessingQueue from "@/components/lab/LabProcessingQueue";
import LabCompletedTests from "@/components/lab/LabCompletedTests";
import LabNotifications from "@/components/lab/LabNotifications";
import LabStudentRecords from "@/components/lab/LabStudentRecords";
import LabAnalytics from "@/components/lab/LabAnalytics";
import LabSettings from "@/components/lab/LabSettings";
import RegisterSampleDialog from "@/components/lab/RegisterSampleDialog";
import { Card, CardContent } from "@/components/ui/card";

interface LabReport {
  id: string;
  test_name: string;
  notes: string | null;
  status: string;
  report_file_url: string | null;
  report_file_name: string | null;
  created_at: string;
  updated_at: string;
  student_id: string;
  doctor_id: string | null;
  prescription_id: string | null;
  student?: { full_name: string; roll_number: string; branch: string | null; program: string };
  doctor?: { name: string; designation: string };
}

export default function LabOfficerDashboard() {
  const { toast } = useToast();
  const { user } = useUserRole();
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [testFilter, setTestFilter] = useState("all");

  const fetchLabReports = async () => {
    setLoading(true);
    try {
      const [reportsRes, studentsRes, doctorsRes] = await Promise.all([
        supabase.from("lab_reports").select("*").order("created_at", { ascending: false }),
        supabase.from("students").select("id, full_name, roll_number, branch, program"),
        supabase.from("medical_officers").select("id, name, designation"),
      ]);
      if (reportsRes.error) throw reportsRes.error;

      const studentsMap = new Map((studentsRes.data || []).map(s => [s.id, s]));
      const doctorsMap = new Map((doctorsRes.data || []).map(d => [d.id, d]));

      const enriched: LabReport[] = (reportsRes.data || []).map(r => ({
        ...r,
        student: studentsMap.get(r.student_id) || undefined,
        doctor: r.doctor_id ? doctorsMap.get(r.doctor_id) || undefined : undefined,
      }));
      setLabReports(enriched);
    } catch (err) {
      console.error("Error fetching lab reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLabReports(); }, []);

  // Handle section changes - open register dialog or refresh data
  const handleSectionChange = (section: string) => {
    if (section === "register") {
      setRegisterOpen(true);
      return;
    }
    setActiveSection(section);
    // Refresh data when switching back to overview or processing
    if (section === "overview" || section === "processing" || section === "completed") {
      fetchLabReports();
    }
  };

  const handleFileUpload = async (report: LabReport, file: File) => {
    if (!user) return;
    setUploadingId(report.id);
    try {
      const fileName = `${report.student_id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("lab-reports").upload(fileName, file);
      if (uploadError) throw uploadError;

      // Store the storage path (not public URL) since bucket is private
      const { error: updateError } = await supabase.from("lab_reports").update({
        report_file_url: fileName,
        report_file_name: file.name,
        status: "completed",
        updated_at: new Date().toISOString(),
      }).eq("id", report.id);
      if (updateError) throw updateError;

      const { data: student } = await supabase.from("students").select("user_id, full_name").eq("id", report.student_id).single();
      if (student?.user_id) {
        await supabase.from("notifications").insert({
          user_id: student.user_id,
          title: "🔬 Lab Report Ready",
          message: `Your ${report.test_name} report has been uploaded. You can view it in your health records.`,
          type: "lab_report",
        });
      }

      toast({ title: "✅ Report Uploaded", description: `Lab report uploaded for ${report.student?.full_name}` });
      fetchLabReports();
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingId(null);
    }
  };

  const pendingReports = useMemo(() => labReports.filter(r => r.status === "pending"), [labReports]);
  const completedReports = useMemo(() => labReports.filter(r => r.status === "completed"), [labReports]);

  const todayStart = startOfDay(new Date());
  const todayReports = labReports.filter(r => isAfter(new Date(r.created_at), todayStart));
  const todayCompleted = completedReports.filter(r => isAfter(new Date(r.updated_at), todayStart));

  const recentUpdates = completedReports.slice(0, 5).map(r => ({
    time: format(new Date(r.updated_at), "hh:mm a"),
    text: `Completed ${r.test_name} for ${r.student?.full_name || "Unknown"} (${r.student?.roll_number || ""})`,
    type: "success" as const,
  }));

  const renderSection = () => {
    if (loading) {
      return <Card><CardContent className="p-12 text-center text-muted-foreground">Loading lab data...</CardContent></Card>;
    }

    switch (activeSection) {
      case "overview":
        return (
          <LabOverview
            totalToday={todayReports.length}
            pending={pendingReports.length}
            completed={todayCompleted.length}
            critical={0}
            recentUpdates={recentUpdates}
            allReports={labReports}
            pendingReports={pendingReports}
            onNavigate={handleSectionChange}
            onRefresh={fetchLabReports}
          />
        );
      case "processing":
        return (
          <LabProcessingQueue
            reports={pendingReports}
            onUpload={handleFileUpload}
            uploadingId={uploadingId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            testFilter={testFilter}
            onTestFilterChange={setTestFilter}
            onRefresh={fetchLabReports}
          />
        );
      case "completed":
        return (
          <LabCompletedTests
            reports={completedReports}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onRefresh={fetchLabReports}
          />
        );
      case "students":
        return (
          <LabStudentRecords
            reports={labReports}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        );
      case "notifications":
        return <LabNotifications labReports={labReports} />;
      case "analytics":
        return <LabAnalytics reports={labReports} />;
      case "settings":
        return <LabSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f3f4f6]">
      <LabSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold text-[#1e3a8a]">Laboratory Management Dashboard</h1>
            <p className="text-xs text-muted-foreground">NIT Warangal Health Centre</p>
          </div>
          <div className="text-xs text-muted-foreground">
            {format(new Date(), "EEEE, dd MMMM yyyy • hh:mm a")}
          </div>
        </div>

        <div className="p-6">
          {renderSection()}
        </div>
      </main>

      <RegisterSampleDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegistered={() => {
          fetchLabReports();
          setRegisterOpen(false);
        }}
      />
    </div>
  );
}
