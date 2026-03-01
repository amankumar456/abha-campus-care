import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { FlaskConical, Upload, CheckCircle2, Clock, User, Stethoscope, Calendar, FileText, Download } from "lucide-react";
import { format } from "date-fns";

interface LabTestPrescription {
  id: string;
  diagnosis: string | null;
  notes: string | null;
  created_at: string;
  student_id: string;
  doctor_id: string | null;
  student?: { full_name: string; roll_number: string; branch: string | null; program: string };
  doctor?: { name: string; designation: string };
  // From notes or diagnosis, extract test names
  test_names: string[];
  report?: { id: string; status: string; report_file_url: string | null; report_file_name: string | null; created_at: string } | null;
}

export default function LabOfficerDashboard() {
  const { toast } = useToast();
  const { user } = useUserRole();
  const [prescriptions, setPrescriptions] = useState<LabTestPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const fetchLabPrescriptions = async () => {
    setLoading(true);
    try {
      // Fetch prescriptions that have test-related notes (contain "test", "lab", "report", "investigation")
      const { data: prescriptionsData, error } = await supabase
        .from("prescriptions")
        .select("id, diagnosis, notes, created_at, student_id, doctor_id")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const enriched: LabTestPrescription[] = [];
      for (const p of prescriptionsData || []) {
        // Check if prescription has lab test reference (from notes field or external referral)
        const hasLabReference = p.notes?.toLowerCase().match(/test|lab|report|investigation|x-ray|mri|ct scan|blood|urine|ecg|ultrasound/i);
        if (!hasLabReference) continue;

        const { data: student } = await supabase
          .from("students")
          .select("full_name, roll_number, branch, program")
          .eq("id", p.student_id)
          .single();

        let doctor = null;
        if (p.doctor_id) {
          const { data: d } = await supabase
            .from("medical_officers")
            .select("name, designation")
            .eq("id", p.doctor_id)
            .single();
          doctor = d;
        }

        // Check existing lab report
        const { data: report } = await supabase
          .from("lab_reports")
          .select("id, status, report_file_url, report_file_name, created_at")
          .eq("prescription_id", p.id)
          .maybeSingle();

        // Extract test names from notes
        const testNames = extractTestNames(p.notes || "");

        enriched.push({
          ...p,
          student: student || undefined,
          doctor: doctor || undefined,
          test_names: testNames,
          report: report || null,
        });
      }

      setPrescriptions(enriched);
    } catch (err) {
      console.error("Error fetching lab prescriptions:", err);
    } finally {
      setLoading(false);
    }
  };

  const extractTestNames = (notes: string): string[] => {
    const testKeywords = ["blood test", "urine test", "x-ray", "mri", "ct scan", "ecg", "ultrasound", "cbc", "liver function", "kidney function", "thyroid", "hemoglobin", "blood sugar", "lipid profile"];
    const found: string[] = [];
    const lower = notes.toLowerCase();
    testKeywords.forEach(kw => {
      if (lower.includes(kw)) found.push(kw.charAt(0).toUpperCase() + kw.slice(1));
    });
    if (found.length === 0 && notes) found.push("Lab Investigation");
    return found;
  };

  useEffect(() => {
    fetchLabPrescriptions();
  }, []);

  const handleFileUpload = async (prescription: LabTestPrescription, file: File) => {
    if (!user) return;
    setUploadingId(prescription.id);

    try {
      const fileName = `${prescription.student_id}/${Date.now()}_${file.name}`;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("lab-reports")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("lab-reports")
        .getPublicUrl(fileName);

      // Create or update lab report record
      if (prescription.report?.id) {
        await supabase
          .from("lab_reports")
          .update({
            report_file_url: urlData.publicUrl,
            report_file_name: file.name,
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", prescription.report.id);
      } else {
        await supabase
          .from("lab_reports")
          .insert({
            prescription_id: prescription.id,
            student_id: prescription.student_id,
            doctor_id: prescription.doctor_id,
            test_name: prescription.test_names.join(", "),
            report_file_url: urlData.publicUrl,
            report_file_name: file.name,
            uploaded_by: user.id,
            status: "completed",
          });
      }

      toast({
        title: "✅ Report Uploaded",
        description: `Lab report uploaded for ${prescription.student?.full_name}`,
      });

      fetchLabPrescriptions();
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingId(null);
    }
  };

  const pendingTests = prescriptions.filter(p => !p.report || p.report.status === "pending");
  const completedTests = prescriptions.filter(p => p.report?.status === "completed");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <FlaskConical className="w-6 h-6 text-blue-600" />
            </div>
            Lab Officer Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage lab tests and upload diagnostic reports</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">{pendingTests.length}</p>
              <p className="text-sm text-muted-foreground">Pending Tests</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">{completedTests.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pending ({pendingTests.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3 mt-4">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading lab tests...</p>
            ) : pendingTests.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No pending lab tests</CardContent></Card>
            ) : (
              pendingTests.map(p => (
                <Card key={p.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{p.student?.full_name}</span>
                          <Badge variant="outline">{p.student?.roll_number}</Badge>
                          {p.student?.branch && <Badge variant="secondary" className="text-xs">{p.student.branch}</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Stethoscope className="w-3 h-3" />
                          <span>Dr. {p.doctor?.name || "Unknown"}</span>
                          <span>•</span>
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(p.created_at), "dd MMM yyyy")}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {p.test_names.map((t, i) => (
                            <Badge key={i} className="bg-blue-100 text-blue-800 text-xs">{t}</Badge>
                          ))}
                        </div>
                        {p.notes && <p className="text-sm text-muted-foreground">{p.notes}</p>}
                      </div>
                      <div>
                        <label className="cursor-pointer">
                          <Input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(p, file);
                            }}
                            disabled={uploadingId === p.id}
                          />
                          <Button variant="default" size="sm" asChild disabled={uploadingId === p.id}>
                            <span>
                              <Upload className="w-4 h-4 mr-1" />
                              {uploadingId === p.id ? "Uploading..." : "Upload Report (PDF)"}
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3 mt-4">
            {completedTests.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No completed reports yet</CardContent></Card>
            ) : (
              completedTests.map(p => (
                <Card key={p.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{p.student?.full_name}</span>
                          <Badge variant="outline">{p.student?.roll_number}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Stethoscope className="w-3 h-3" />
                          <span>Dr. {p.doctor?.name}</span>
                          <span>•</span>
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(p.created_at), "dd MMM yyyy")}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {p.test_names.map((t, i) => (
                            <Badge key={i} className="bg-green-100 text-green-800 text-xs">{t}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-600">Completed</Badge>
                        {p.report?.report_file_url && (
                          <a href={p.report.report_file_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-1" />
                              View Report
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
