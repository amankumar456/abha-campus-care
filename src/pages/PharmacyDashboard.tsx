import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Pill, CheckCircle2, XCircle, Clock, Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PrescriptionCard } from "@/components/pharmacy/PrescriptionCard";
import { InventoryManagement } from "@/components/pharmacy/InventoryManagement";
import { PrescriptionWithDetails } from "@/components/pharmacy/types";
import { startOfDay, startOfWeek, subDays, subWeeks, isAfter } from "date-fns";

type DateFilter = "all" | "today" | "yesterday" | "this_week" | "last_week" | "latest";

export default function PharmacyDashboard() {
  const { toast } = useToast();
  const { user } = useUserRole();
  const [searchParams] = useSearchParams();
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const initialFilter = searchParams.get("filter") || "pending";
  const initialTab = searchParams.get("tab") || "prescriptions";
  const [activeTab, setActiveTab] = useState(initialFilter);
  const [mainTab, setMainTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      // Batch fetch all data in parallel instead of N+1 queries
      const [prescRes, studentsRes, doctorsRes, itemsRes, dispensingRes] = await Promise.all([
        supabase.from("prescriptions").select("id, diagnosis, notes, created_at, student_id, doctor_id, appointment_id").order("created_at", { ascending: false }),
        supabase.from("students").select("id, full_name, roll_number, branch, program"),
        supabase.from("medical_officers").select("id, name, designation"),
        supabase.from("prescription_items").select("*"),
        supabase.from("pharmacy_dispensing").select("id, status, prescription_id"),
      ]);

      if (prescRes.error) throw prescRes.error;

      const studentsMap = new Map((studentsRes.data || []).map(s => [s.id, s]));
      const doctorsMap = new Map((doctorsRes.data || []).map(d => [d.id, d]));
      const itemsMap = new Map<string, typeof itemsRes.data>();
      for (const item of itemsRes.data || []) {
        const existing = itemsMap.get(item.prescription_id) || [];
        existing.push(item);
        itemsMap.set(item.prescription_id, existing);
      }
      const dispensingMap = new Map((dispensingRes.data || []).map(d => [d.prescription_id, d]));

      const enriched: PrescriptionWithDetails[] = (prescRes.data || []).map(p => {
        const dispensing = dispensingMap.get(p.id);
        return {
          ...p,
          student: studentsMap.get(p.student_id) || undefined,
          doctor: p.doctor_id ? doctorsMap.get(p.doctor_id) || undefined : undefined,
          items: itemsMap.get(p.id) || [],
          dispensing_status: dispensing?.status || "pending",
          dispensing_id: dispensing?.id,
        };
      });

      setPrescriptions(enriched);
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrescriptions(); }, []);

  const handleDispense = async (prescription: PrescriptionWithDetails, action: "approved" | "denied") => {
    if (!user) return;
    try {
      if (prescription.dispensing_id) {
        const { error } = await supabase.from("pharmacy_dispensing").update({
          status: action,
          dispensed_at: action === "approved" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        }).eq("id", prescription.dispensing_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pharmacy_dispensing").insert({
          prescription_id: prescription.id,
          student_id: prescription.student_id,
          dispensed_by: user.id,
          status: action,
          dispensed_at: action === "approved" ? new Date().toISOString() : null,
        });
        if (error) throw error;
      }

      // Decrement inventory for each dispensed medicine
      if (action === "approved" && prescription.items && prescription.items.length > 0) {
        for (const item of prescription.items) {
          const { data: inventoryItem } = await supabase
            .from("pharmacy_inventory")
            .select("id, quantity")
            .ilike("medicine_name", item.medicine_name)
            .maybeSingle();

          if (inventoryItem && inventoryItem.quantity > 0) {
            await supabase
              .from("pharmacy_inventory")
              .update({ quantity: inventoryItem.quantity - 1 })
              .eq("id", inventoryItem.id);
          }
        }
      }

      if (action === "approved") {
        const { data: student } = await supabase.from("students").select("user_id, full_name").eq("id", prescription.student_id).single();
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

  const filteredPrescriptions = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = startOfDay(subDays(now, 1));
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = thisWeekStart;

    return prescriptions.filter(p => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!p.student?.full_name?.toLowerCase().includes(q) && !p.student?.roll_number?.toLowerCase().includes(q)) {
          return false;
        }
      }

      // Date filter
      if (dateFilter === "all" || dateFilter === "latest") return true;
      const date = new Date(p.created_at);
      switch (dateFilter) {
        case "today": return isAfter(date, todayStart);
        case "yesterday": return isAfter(date, yesterdayStart) && !isAfter(date, todayStart);
        case "this_week": return isAfter(date, thisWeekStart);
        case "last_week": return isAfter(date, lastWeekStart) && !isAfter(date, lastWeekEnd);
        default: return true;
      }
    });
  }, [prescriptions, searchQuery, dateFilter]);

  const pendingPrescriptions = filteredPrescriptions.filter(p => p.dispensing_status === "pending");
  const approvedPrescriptions = filteredPrescriptions.filter(p => p.dispensing_status === "approved");
  const deniedPrescriptions = filteredPrescriptions.filter(p => p.dispensing_status === "denied");

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

        {/* Main Tabs: Prescriptions vs Inventory */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="prescriptions" className="flex items-center gap-1">
              <Pill className="w-4 h-4" /> Prescriptions
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-1">
              <Package className="w-4 h-4" /> Medicine Inventory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prescriptions" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
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

            {/* Search + Date Filter */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by student name or roll number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="last_week">Last Week</SelectItem>
                  <SelectItem value="latest">Latest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prescription Tabs */}
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
                  pendingPrescriptions.map(p => <PrescriptionCard key={p.id} p={p} showActions onDispense={handleDispense} />)
                )}
              </TabsContent>

              <TabsContent value="approved" className="space-y-3 mt-4">
                {approvedPrescriptions.length === 0 ? (
                  <Card><CardContent className="p-8 text-center text-muted-foreground">No dispensed prescriptions yet</CardContent></Card>
                ) : (
                  approvedPrescriptions.map(p => <PrescriptionCard key={p.id} p={p} showActions={false} onDispense={handleDispense} />)
                )}
              </TabsContent>

              <TabsContent value="denied" className="space-y-3 mt-4">
                {deniedPrescriptions.length === 0 ? (
                  <Card><CardContent className="p-8 text-center text-muted-foreground">No denied prescriptions</CardContent></Card>
                ) : (
                  deniedPrescriptions.map(p => <PrescriptionCard key={p.id} p={p} showActions={false} onDispense={handleDispense} />)
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryManagement />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
