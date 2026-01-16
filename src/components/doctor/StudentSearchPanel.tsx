import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { format } from "date-fns";

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  program: string;
  batch: string;
  email: string | null;
  phone: string | null;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Search students by name or roll number
  const { data: students, isLoading: isSearching } = useQuery({
    queryKey: ["student-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .or(`full_name.ilike.%${searchQuery}%,roll_number.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      return data as Student[];
    },
    enabled: searchQuery.length >= 2,
  });

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
                  {selectedStudent.email && (
                    <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                  )}
                </div>
              </div>
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
                {isLoadingVisits ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : healthVisits && healthVisits.length > 0 ? (
                  <div className="space-y-3">
                    {healthVisits.map((visit) => (
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
