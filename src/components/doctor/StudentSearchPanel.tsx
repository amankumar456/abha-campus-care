import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  User,
  Calendar,
  FileText,
  Activity,
  Clock,
  ChevronRight,
  AlertCircle,
  Loader2,
  Download,
  Filter,
  X,
} from "lucide-react";
import { format, isAfter, isBefore, parseISO, startOfDay, endOfDay } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const REASON_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "medical_illness", label: "Medical Illness" },
  { value: "injury", label: "Injury" },
  { value: "mental_wellness", label: "Mental Wellness" },
  { value: "vaccination", label: "Vaccination" },
  { value: "routine_checkup", label: "Routine Checkup" },
  { value: "other", label: "Other" },
];

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  program: string;
  batch: string;
  branch: string | null;
  year_of_study: string | null;
  // Note: email and phone are NOT included for privacy - doctors use limited view
}

interface HealthVisit {
  id: string;
  visit_date: string;
  reason_category: string;
  reason_subcategory: string | null;
  diagnosis: string | null;
  prescription: string | null;
  follow_up_required: boolean | null;
  follow_up_date: string | null;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string | null;
  status: string | null;
  doctor_type: string;
}

const StudentSearchPanel = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Fetch all students by default
  const { data: allStudents, isLoading: isLoadingAll } = useQuery({
    queryKey: ["all-students-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students_doctor_view")
        .select("id, full_name, roll_number, program, batch, branch, year_of_study")
        .order("full_name");

      if (error) throw error;
      return data as Student[];
    },
  });

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!allStudents) return [];
    if (!searchQuery || searchQuery.length < 2) return allStudents;
    const q = searchQuery.toLowerCase();
    return allStudents.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.roll_number.toLowerCase().includes(q)
    );
  }, [allStudents, searchQuery]);

  // Filter states
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch health visits for selected student
  const { data: healthVisits, isLoading: isLoadingVisits } = useQuery({
    queryKey: ["student-health-visits", selectedStudent?.id],
    queryFn: async () => {
      if (!selectedStudent) return [];
      
      const { data, error } = await supabase
        .from("health_visits")
        .select("*")
        .eq("student_id", selectedStudent.id)
        .order("visit_date", { ascending: false });

      if (error) throw error;
      return data as HealthVisit[];
    },
    enabled: !!selectedStudent,
  });

  // Fetch appointments for selected student
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["student-appointments", selectedStudent?.id],
    queryFn: async () => {
      if (!selectedStudent) return [];
      
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", selectedStudent.id)
        .order("appointment_date", { ascending: false });

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!selectedStudent,
  });

  // Filter health visits based on date range and category
  const filteredHealthVisits = useMemo(() => {
    if (!healthVisits) return [];
    
    return healthVisits.filter((visit) => {
      // Category filter
      if (selectedCategory !== "all" && visit.reason_category !== selectedCategory) {
        return false;
      }
      
      // Date range filter
      const visitDate = parseISO(visit.visit_date);
      
      if (dateFrom) {
        const fromDate = startOfDay(parseISO(dateFrom));
        if (isBefore(visitDate, fromDate)) {
          return false;
        }
      }
      
      if (dateTo) {
        const toDate = endOfDay(parseISO(dateTo));
        if (isAfter(visitDate, toDate)) {
          return false;
        }
      }
      
      return true;
    });
  }, [healthVisits, dateFrom, dateTo, selectedCategory]);

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSelectedCategory("all");
  };

  const hasActiveFilters = dateFrom || dateTo || selectedCategory !== "all";

  const formatReasonCategory = (category: string) => {
    return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "confirmed":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
      case "cancelled":
        return "bg-red-500/10 text-red-700 border-red-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const exportToPDF = () => {
    if (!selectedStudent) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 51, 102);
    doc.text("NIT Warangal Health Centre", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text("Student Health Records", pageWidth / 2, 28, { align: "center" });

    // Student Info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Student: ${selectedStudent.full_name}`, 14, 45);
    doc.text(`Roll Number: ${selectedStudent.roll_number}`, 14, 52);
    doc.text(`Program: ${selectedStudent.program} | Batch: ${selectedStudent.batch}`, 14, 59);
    if (selectedStudent.branch) {
      doc.text(`Branch: ${selectedStudent.branch}`, 14, 66);
    }
    
    doc.text(`Report Generated: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, 14, 76);

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 82, pageWidth - 14, 82);

    // Health Visits Table
    if (healthVisits && healthVisits.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0, 51, 102);
      doc.text("Health Visit History", 14, 92);

      const visitData = healthVisits.map((visit) => [
        format(new Date(visit.visit_date), "dd MMM yyyy"),
        formatReasonCategory(visit.reason_category),
        visit.reason_subcategory || "-",
        visit.diagnosis || "-",
        visit.prescription || "-",
        visit.follow_up_required ? "Yes" : "No",
      ]);

      autoTable(doc, {
        startY: 98,
        head: [["Date", "Reason", "Sub-Category", "Diagnosis", "Prescription", "Follow-up"]],
        body: visitData,
        theme: "striped",
        headStyles: { fillColor: [0, 51, 102] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 35 },
          4: { cellWidth: 45 },
          5: { cellWidth: 20 },
        },
      });
    } else {
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text("No health visit records found.", 14, 92);
    }

    // Appointments Table
    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    
    if (appointments && appointments.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0, 51, 102);
      doc.text("Appointment History", 14, finalY + 15);

      const appointmentData = appointments.map((apt) => [
        format(new Date(apt.appointment_date), "dd MMM yyyy"),
        apt.appointment_time,
        apt.doctor_type,
        apt.reason || "-",
        apt.status?.charAt(0).toUpperCase() + apt.status?.slice(1) || "-",
      ]);

      autoTable(doc, {
        startY: finalY + 21,
        head: [["Date", "Time", "Doctor Type", "Reason", "Status"]],
        body: appointmentData,
        theme: "striped",
        headStyles: { fillColor: [0, 102, 51] },
        styles: { fontSize: 9, cellPadding: 3 },
      });
    }

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        "This is a confidential medical document. Unauthorized distribution is prohibited.",
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    // Save
    doc.save(`${selectedStudent.roll_number}_health_records.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Student Records Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter student name or roll number..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedStudent(null);
                }}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {isSearching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Searching...</span>
              </div>
            )}

            {students && students.length > 0 && !selectedStudent && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Found {students.length} student(s)
                </p>
                {students.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {student.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {student.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {student.roll_number} • {student.program} • {student.batch}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && students?.length === 0 && !isSearching && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <AlertCircle className="w-5 h-5 mr-2" />
                No students found matching "{searchQuery}"
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Student Details */}
      {selectedStudent && (
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {selectedStudent.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{selectedStudent.full_name}</CardTitle>
                  <p className="text-muted-foreground">
                    {selectedStudent.roll_number} • {selectedStudent.program} •{" "}
                    {selectedStudent.batch}
                  </p>
                  {selectedStudent.branch && (
                    <p className="text-sm text-muted-foreground">Branch: {selectedStudent.branch}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={exportToPDF}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedStudent(null);
                    setSearchQuery("");
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Tabs defaultValue="health-history" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="health-history" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Health History ({healthVisits?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="appointments" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Appointments ({appointments?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* Health History Tab */}
              <TabsContent value="health-history" className="mt-4">
                {/* Filters Section */}
                <Card className="mb-4 bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Filters</span>
                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="ml-auto h-7 text-xs"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Clear Filters
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="date-from" className="text-xs">From Date</Label>
                        <Input
                          id="date-from"
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="date-to" className="text-xs">To Date</Label>
                        <Input
                          id="date-to"
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="category" className="text-xs">Reason Category</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger id="category" className="h-9">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {REASON_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {hasActiveFilters && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Showing {filteredHealthVisits.length} of {healthVisits?.length || 0} records
                      </p>
                    )}
                  </CardContent>
                </Card>

                {isLoadingVisits ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : filteredHealthVisits.length > 0 ? (
                  <div className="space-y-3">
                    {filteredHealthVisits.map((visit) => (
                      <Card key={visit.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <Badge variant="outline" className="mb-2">
                                {formatReasonCategory(visit.reason_category)}
                              </Badge>
                              {visit.reason_subcategory && (
                                <Badge variant="secondary" className="ml-2 mb-2">
                                  {visit.reason_subcategory}
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(visit.visit_date), "dd MMM yyyy")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(visit.visit_date), "hh:mm a")}
                              </p>
                            </div>
                          </div>

                          {visit.diagnosis && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-muted-foreground uppercase">
                                Diagnosis
                              </p>
                              <p className="text-sm text-foreground">{visit.diagnosis}</p>
                            </div>
                          )}

                          {visit.prescription && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-muted-foreground uppercase">
                                Prescription
                              </p>
                              <p className="text-sm text-foreground">{visit.prescription}</p>
                            </div>
                          )}

                          {visit.follow_up_required && visit.follow_up_date && (
                            <div className="mt-3 p-2 rounded bg-warning/10 border border-warning/20">
                              <p className="text-xs font-medium text-warning flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Follow-up scheduled:{" "}
                                {format(new Date(visit.follow_up_date), "dd MMM yyyy")}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : healthVisits && healthVisits.length > 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Filter className="w-12 h-12 mb-3 opacity-50" />
                    <p>No records match your filters</p>
                    <Button variant="link" onClick={clearFilters} className="mt-2">
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mb-3 opacity-50" />
                    <p>No health visit records found</p>
                  </div>
                )}
              </TabsContent>

              {/* Appointments Tab */}
              <TabsContent value="appointments" className="mt-4">
                {isLoadingAppointments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : appointments && appointments.length > 0 ? (
                  <div className="space-y-3">
                    {appointments.map((apt) => (
                      <Card key={apt.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getStatusColor(apt.status)}>
                                  {apt.status?.charAt(0).toUpperCase() +
                                    apt.status?.slice(1) || "Unknown"}
                                </Badge>
                                <Badge variant="outline">{apt.doctor_type}</Badge>
                              </div>
                              {apt.reason && (
                                <p className="text-sm text-foreground mt-2">
                                  <span className="font-medium">Reason:</span> {apt.reason}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium flex items-center gap-1 justify-end">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(apt.appointment_date), "dd MMM yyyy")}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                                <Clock className="w-3 h-3" />
                                {apt.appointment_time}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Calendar className="w-12 h-12 mb-3 opacity-50" />
                    <p>No appointments found</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentSearchPanel;
