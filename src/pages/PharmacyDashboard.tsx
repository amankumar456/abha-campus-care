import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Pill, CheckCircle2, XCircle, Clock, Eye, User, Stethoscope, Calendar, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface PrescriptionWithDetails {
  id: string;
  diagnosis: string | null;
  notes: string | null;
  created_at: string;
  student_id: string;
  doctor_id: string | null;
  appointment_id: string;
  student?: { full_name: string; roll_number: string; branch: string | null; program: string };
  doctor?: { name: string; designation: string };
  items?: { id: string; medicine_name: string; dosage: string; frequency: string; duration: string; instructions: string | null; meal_timing: string | null }[];
  dispensing_status?: string;
  dispensing_id?: string;
}

export default function PharmacyDashboard() {
  const { toast } = useToast();
  const { user } = useUserRole();
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionWithDetails | null>(null);
  const [dispensedHistory, setDispensedHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      // Fetch all prescriptions with student and doctor info
      const { data: prescriptionsData, error } = await supabase
        .from("prescriptions")
        .select(`
          id, diagnosis, notes, created_at, student_id, doctor_id, appointment_id
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch related data for each prescription
      const enriched: PrescriptionWithDetails[] = [];
      for (const p of prescriptionsData || []) {
        // Get student
        const { data: student } = await supabase
          .from("students")
          .select("full_name, roll_number, branch, program")
          .eq("id", p.student_id)
          .single();

        // Get doctor
        let doctor = null;
        if (p.doctor_id) {
          const { data: d } = await supabase
            .from("medical_officers")
            .select("name, designation")
            .eq("id", p.doctor_id)
            .single();
          doctor = d;
        }

        // Get prescription items
        const { data: items } = await supabase
          .from("prescription_items")
          .select("*")
          .eq("prescription_id", p.id);

        // Check dispensing status
        const { data: dispensing } = await supabase
          .from("pharmacy_dispensing")
          .select("id, status")
          .eq("prescription_id", p.id)
          .maybeSingle();

        enriched.push({
          ...p,
          student: student || undefined,
          doctor: doctor || undefined,
          items: items || [],
          dispensing_status: dispensing?.status || "pending",
          dispensing_id: dispensing?.id,
        });
      }

      setPrescriptions(enriched);
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleDispense = async (prescription: PrescriptionWithDetails, action: "approved" | "denied") => {
    if (!user) return;

    try {
      if (prescription.dispensing_id) {
        const { error } = await supabase
          .from("pharmacy_dispensing")
          .update({
            status: action,
            dispensed_at: action === "approved" ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", prescription.dispensing_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("pharmacy_dispensing")
          .insert({
            prescription_id: prescription.id,
            student_id: prescription.student_id,
            dispensed_by: user.id,
            status: action,
            dispensed_at: action === "approved" ? new Date().toISOString() : null,
          });
        if (error) throw error;
      }

      // Send notification to student
      if (action === "approved") {
        const { data: student } = await supabase
          .from("students")
          .select("user_id, full_name")
          .eq("id", prescription.student_id)
          .single();

        if (student?.user_id) {
          const medicineNames = prescription.items?.map(i => i.medicine_name).join(", ") || "your medicines";
          await supabase.from("notifications").insert({
            user_id: student.user_id,
            title: "💊 Medicines Delivered",
            message: `Your medicines (${medicineNames}) have been dispensed at the pharmacy. Please collect them from the Health Centre pharmacy counter.`,
            type: "pharmacy",
          });
        }
      }

      toast({
        title: action === "approved" ? "✅ Medicine Dispensed" : "❌ Prescription Denied",
        description: action === "approved"
          ? `Medicine dispensed to ${prescription.student?.full_name}`
          : `Prescription for ${prescription.student?.full_name} was denied`,
      });

      fetchPrescriptions();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const filterBySearch = (list: PrescriptionWithDetails[]) =>
    list.filter(p => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.student?.full_name?.toLowerCase().includes(q) ||
        p.student?.roll_number?.toLowerCase().includes(q)
      );
    });

  const pendingPrescriptions = filterBySearch(prescriptions.filter(p => p.dispensing_status === "pending"));
  const approvedPrescriptions = filterBySearch(prescriptions.filter(p => p.dispensing_status === "approved"));
  const deniedPrescriptions = filterBySearch(prescriptions.filter(p => p.dispensing_status === "denied"));

  const PrescriptionCard = ({ p, showActions }: { p: PrescriptionWithDetails; showActions: boolean }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{p.student?.full_name || "Unknown"}</span>
              <Badge variant="outline">{p.student?.roll_number}</Badge>
              {p.student?.branch && <Badge variant="secondary" className="text-xs">{p.student.branch}</Badge>}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Stethoscope className="w-3 h-3" />
              <span>Dr. {p.doctor?.name || "Unknown"}</span>
              <span>•</span>
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(p.created_at), "dd MMM yyyy, hh:mm a")}</span>
            </div>
            {p.diagnosis && (
              <p className="text-sm"><strong>Diagnosis:</strong> {p.diagnosis}</p>
            )}
            <div className="flex flex-wrap gap-1 mt-1">
              {p.items?.map((item) => (
                <Badge key={item.id} variant="outline" className="text-xs">
                  {item.medicine_name} - {item.dosage}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setSelectedPrescription(p)}>
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Prescription Details
                  </DialogTitle>
                </DialogHeader>
                {selectedPrescription && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Patient</p>
                        <p className="font-medium">{selectedPrescription.student?.full_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Roll Number</p>
                        <p className="font-medium">{selectedPrescription.student?.roll_number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Doctor</p>
                        <p className="font-medium">Dr. {selectedPrescription.doctor?.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Date</p>
                        <p className="font-medium">{format(new Date(selectedPrescription.created_at), "dd MMM yyyy, hh:mm a")}</p>
                      </div>
                    </div>
                    {selectedPrescription.diagnosis && (
                      <div>
                        <p className="text-xs text-muted-foreground">Diagnosis</p>
                        <p className="font-medium">{selectedPrescription.diagnosis}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Medicines</p>
                      <div className="space-y-2">
                        {selectedPrescription.items?.map((item, i) => (
                          <div key={item.id} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Pill className="w-4 h-4 text-primary" />
                              <span className="font-medium">{item.medicine_name}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-1 text-sm text-muted-foreground">
                              <span>Dosage: {item.dosage}</span>
                              <span>Frequency: {item.frequency}</span>
                              <span>Duration: {item.duration}</span>
                            </div>
                            {item.instructions && (
                              <p className="text-xs text-muted-foreground mt-1">Instructions: {item.instructions}</p>
                            )}
                            {item.meal_timing && (
                              <p className="text-xs text-muted-foreground">Timing: {item.meal_timing === "before_meal" ? "Before Meal" : "After Meal"}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedPrescription.notes && (
                      <div>
                        <p className="text-xs text-muted-foreground">Doctor's Notes</p>
                        <p className="text-sm">{selectedPrescription.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
            {showActions && (
              <>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleDispense(p, "approved")}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDispense(p, "denied")}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Deny
                </Button>
              </>
            )}
            {!showActions && (
              <Badge variant={p.dispensing_status === "approved" ? "default" : "destructive"}>
                {p.dispensing_status === "approved" ? "Dispensed" : "Denied"}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Pill className="w-6 h-6 text-purple-600" />
            </div>
            Pharmacy Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">View and manage medicine dispensing for student prescriptions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">{pendingPrescriptions.length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">{approvedPrescriptions.length}</p>
              <p className="text-sm text-muted-foreground">Dispensed</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4 text-center">
              <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">{deniedPrescriptions.length}</p>
              <p className="text-sm text-muted-foreground">Denied</p>
            </CardContent>
          </Card>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> Pending ({pendingPrescriptions.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Dispensed ({approvedPrescriptions.length})
            </TabsTrigger>
            <TabsTrigger value="denied" className="flex items-center gap-1">
              <XCircle className="w-4 h-4" /> Denied ({deniedPrescriptions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3 mt-4">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading prescriptions...</p>
            ) : pendingPrescriptions.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No pending prescriptions</CardContent></Card>
            ) : (
              pendingPrescriptions.map(p => <PrescriptionCard key={p.id} p={p} showActions={true} />)
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-3 mt-4">
            {approvedPrescriptions.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No dispensed prescriptions yet</CardContent></Card>
            ) : (
              approvedPrescriptions.map(p => <PrescriptionCard key={p.id} p={p} showActions={false} />)
            )}
          </TabsContent>

          <TabsContent value="denied" className="space-y-3 mt-4">
            {deniedPrescriptions.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No denied prescriptions</CardContent></Card>
            ) : (
              deniedPrescriptions.map(p => <PrescriptionCard key={p.id} p={p} showActions={false} />)
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
