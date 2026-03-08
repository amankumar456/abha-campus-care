import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isThisWeek, isThisMonth, subDays, parseISO, startOfDay } from "date-fns";
import {
  Hospital, Microscope, HeartPulse, TrendingUp, TrendingDown, Minus,
  Search, Filter, ChevronDown, ChevronUp, Clock, User, FileText,
  ExternalLink, Pill, ClipboardList, Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface DoctorTreatmentOverviewProps {
  doctorId: string | null;
}

type DateRange = "today" | "week" | "month";
type ActiveCard = "off-campus" | "tests" | "on-campus" | null;

export default function DoctorTreatmentOverview({ doctorId }: DoctorTreatmentOverviewProps) {
  const [activeCard, setActiveCard] = useState<ActiveCard>(null);
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch off-campus treatment referrals
  const { data: offCampusData, isLoading: offCampusLoading } = useQuery({
    queryKey: ["treatment-off-campus", doctorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("medical_leave_requests")
        .select(`
          id, referral_type, referral_hospital, doctor_notes, illness_description,
          status, created_at, rest_days, referral_date, health_priority,
          students!medical_leave_requests_student_id_fkey (full_name, roll_number, program, branch)
        `)
        
        .contains("referral_type", ["treatment"])
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!doctorId,
  });

  // Fetch test/checkup referrals
  const { data: testsData, isLoading: testsLoading } = useQuery({
    queryKey: ["treatment-tests", doctorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("medical_leave_requests")
        .select(`
          id, referral_type, referral_hospital, doctor_notes, illness_description,
          status, created_at, rest_days, referral_date, health_priority,
          students!medical_leave_requests_student_id_fkey (full_name, roll_number, program, branch)
        `)
        
        .contains("referral_type", ["test_checkup"])
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!doctorId,
  });

  // Fetch on-campus treatments (students with prescriptions generated)
  const { data: onCampusData, isLoading: onCampusLoading } = useQuery({
    queryKey: ["treatment-on-campus", doctorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("prescriptions")
        .select(`
          id, diagnosis, notes, created_at, student_id,
          appointments!prescriptions_appointment_id_fkey (appointment_date, appointment_time, reason, health_priority),
          prescription_items (medicine_name, dosage, frequency, duration, meal_timing)
        `)
        
        .order("created_at", { ascending: false });

      // Fetch student details separately
      if (!data || data.length === 0) return [];
      const studentIds = [...new Set(data.map(d => d.student_id))];
      const { data: students } = await supabase
        .from("students")
        .select("id, full_name, roll_number, program, branch")
        .in("id", studentIds);
      const studentMap = new Map((students || []).map(s => [s.id, s]));
      return data.map(d => ({ ...d, student: studentMap.get(d.student_id) || null }));
    },
    enabled: !!doctorId,
  });

  // Yesterday's counts for trend comparison
  const yesterday = subDays(new Date(), 1);
  const yesterdayStr = format(yesterday, "yyyy-MM-dd");

  const filterByDateRange = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (dateRange === "today") return isToday(date);
    if (dateRange === "week") return isThisWeek(date);
    if (dateRange === "month") return isThisMonth(date);
    return true;
  };

  const filteredOffCampus = useMemo(() => {
    return (offCampusData || []).filter(item => {
      const dateMatch = filterByDateRange(item.created_at);
      const searchMatch = !searchQuery ||
        (item.students as any)?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.students as any)?.roll_number?.toLowerCase().includes(searchQuery.toLowerCase());
      const statusMatch = statusFilter === "all" || item.status === statusFilter;
      return dateMatch && searchMatch && statusMatch;
    });
  }, [offCampusData, dateRange, searchQuery, statusFilter]);

  const filteredTests = useMemo(() => {
    return (testsData || []).filter(item => {
      const dateMatch = filterByDateRange(item.created_at);
      const searchMatch = !searchQuery ||
        (item.students as any)?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.students as any)?.roll_number?.toLowerCase().includes(searchQuery.toLowerCase());
      const statusMatch = statusFilter === "all" || item.status === statusFilter;
      return dateMatch && searchMatch && statusMatch;
    });
  }, [testsData, dateRange, searchQuery, statusFilter]);

  const filteredOnCampus = useMemo(() => {
    return (onCampusData || []).filter(item => {
      const dateMatch = filterByDateRange(item.created_at);
      const searchMatch = !searchQuery ||
        item.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student?.roll_number?.toLowerCase().includes(searchQuery.toLowerCase());
      return dateMatch && searchMatch;
    });
  }, [onCampusData, dateRange, searchQuery]);

  // Today vs yesterday counts for trends
  const todayOffCampus = (offCampusData || []).filter(i => isToday(parseISO(i.created_at))).length;
  const yesterdayOffCampus = (offCampusData || []).filter(i => format(parseISO(i.created_at), "yyyy-MM-dd") === yesterdayStr).length;
  const todayTests = (testsData || []).filter(i => isToday(parseISO(i.created_at))).length;
  const yesterdayTests = (testsData || []).filter(i => format(parseISO(i.created_at), "yyyy-MM-dd") === yesterdayStr).length;
  const todayOnCampus = (onCampusData || []).filter(i => isToday(parseISO(i.created_at))).length;
  const yesterdayOnCampus = (onCampusData || []).filter(i => format(parseISO(i.created_at), "yyyy-MM-dd") === yesterdayStr).length;

  const getTrend = (today: number, yesterday: number) => {
    if (today > yesterday) return { icon: TrendingUp, label: `+${today - yesterday} vs yesterday`, color: "text-amber-500" };
    if (today < yesterday) return { icon: TrendingDown, label: `${today - yesterday} vs yesterday`, color: "text-emerald-500" };
    return { icon: Minus, label: "Same as yesterday", color: "text-muted-foreground" };
  };

  const isLoading = offCampusLoading || testsLoading || onCampusLoading;

  const cards = [
    {
      id: "off-campus" as ActiveCard,
      title: "Off-Campus Treatment",
      count: filteredOffCampus.length,
      todayCount: todayOffCampus,
      trend: getTrend(todayOffCampus, yesterdayOffCampus),
      icon: Hospital,
      gradient: "from-orange-500/15 to-red-500/10",
      iconBg: "bg-orange-500/15",
      iconColor: "text-orange-600",
      borderColor: "border-orange-200 dark:border-orange-900/30",
      badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    },
    {
      id: "tests" as ActiveCard,
      title: "Tests / Checkups",
      count: filteredTests.length,
      todayCount: todayTests,
      trend: getTrend(todayTests, yesterdayTests),
      icon: Microscope,
      gradient: "from-blue-500/15 to-indigo-500/10",
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200 dark:border-blue-900/30",
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    },
    {
      id: "on-campus" as ActiveCard,
      title: "On-Campus Treatment",
      count: filteredOnCampus.length,
      todayCount: todayOnCampus,
      trend: getTrend(todayOnCampus, yesterdayOnCampus),
      icon: HeartPulse,
      gradient: "from-emerald-500/15 to-green-500/10",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200 dark:border-emerald-900/30",
      badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
  ];

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      doctor_referred: { label: "Referred", variant: "secondary" },
      student_form_pending: { label: "Form Pending", variant: "outline" },
      on_leave: { label: "On Leave", variant: "default" },
      return_pending: { label: "Return Pending", variant: "outline" },
      returned: { label: "Completed", variant: "secondary" },
      cancelled: { label: "Cancelled", variant: "destructive" },
    };
    const s = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={s.variant} className="text-xs">{s.label}</Badge>;
  };

  const getReasonLabel = (cat: string) => {
    const map: Record<string, string> = {
      medical_illness: "Medical Illness", injury: "Injury", mental_wellness: "Mental Wellness",
      vaccination: "Vaccination", routine_checkup: "Routine Checkup", other: "Other",
    };
    return map[cat] || cat;
  };

  const parseTestDetails = (notes: string | null) => {
    if (!notes) return null;
    const match = notes.match(/Tests?:\s*(.+?)(?:\.|$)/i) || notes.match(/tests?[:\s]+(.+)/i);
    return match ? match[1].trim() : null;
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Treatment Overview</h2>
            <p className="text-sm text-muted-foreground">Real-time student treatment statistics</p>
          </div>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map(card => {
            const isActive = activeCard === card.id;
            const TrendIcon = card.trend.icon;
            return (
              <Card
                key={card.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${card.borderColor} ${
                  isActive ? "ring-2 ring-primary shadow-lg scale-[1.02]" : "hover:scale-[1.01]"
                }`}
                onClick={() => setActiveCard(isActive ? null : card.id)}
              >
                <CardContent className={`p-5 bg-gradient-to-br ${card.gradient} rounded-lg`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                      <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${card.badgeColor}`}>
                      {dateRange === "today" ? "Today" : dateRange === "week" ? "This Week" : "This Month"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-foreground">{card.count}</p>
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  </div>
                  {dateRange === "today" && (
                    <div className={`flex items-center gap-1.5 mt-3 text-xs ${card.trend.color}`}>
                      <TrendIcon className="w-3.5 h-3.5" />
                      <span>{card.trend.label}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    {isActive ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    <span>{isActive ? "Click to collapse" : "Click to view details"}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Panel */}
      {activeCard && (
        <Card className="animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-lg">
                {activeCard === "off-campus" && "Off-Campus Treatment Referrals"}
                {activeCard === "tests" && "Test / Checkup Referrals"}
                {activeCard === "on-campus" && "On-Campus Treatment Records"}
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search student..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 w-48"
                  />
                </div>
                {activeCard !== "on-campus" && (
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                      <Filter className="w-3.5 h-3.5 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="doctor_referred">Referred</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="returned">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Off-Campus List */}
            {activeCard === "off-campus" && (
              filteredOffCampus.length === 0 ? (
                <EmptyState label="No off-campus treatment referrals found" />
              ) : (
                <div className="space-y-3">
                  {filteredOffCampus.map(item => {
                    const student = item.students as any;
                    return (
                      <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground">{student?.full_name}</span>
                            <span className="text-xs text-muted-foreground">{student?.roll_number}</span>
                            {student?.program && <Badge variant="outline" className="text-xs">{student.program} {student.branch && `- ${student.branch}`}</Badge>}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Hospital className="w-3.5 h-3.5" />{item.referral_hospital}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{format(parseISO(item.created_at), "dd MMM, hh:mm a")}</span>
                          </div>
                          {(item.illness_description || item.doctor_notes) && (
                            <div className="flex items-start gap-1.5 mt-1 px-2.5 py-1.5 rounded-lg bg-orange-500/5 border border-orange-200/50 dark:border-orange-900/20">
                              <FileText className="w-3.5 h-3.5 text-orange-600 mt-0.5 shrink-0" />
                              <div className="text-sm">
                                <span className="font-medium text-orange-700 dark:text-orange-300">Purpose: </span>
                                <span className="text-foreground">{item.illness_description || item.doctor_notes}</span>
                              </div>
                            </div>
                          )}
                          {item.doctor_notes && item.illness_description && (
                            <p className="text-xs text-muted-foreground/70 line-clamp-1">Doctor's notes: {item.doctor_notes}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {getStatusBadge(item.status)}
                          {item.rest_days !== null && (
                            <span className="text-xs text-muted-foreground">{item.rest_days} day{item.rest_days !== 1 ? "s" : ""} rest</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Tests List */}
            {activeCard === "tests" && (
              filteredTests.length === 0 ? (
                <EmptyState label="No test/checkup referrals found" />
              ) : (
                <div className="space-y-3">
                  {filteredTests.map(item => {
                    const student = item.students as any;
                    const testDetails = parseTestDetails(item.doctor_notes);
                    return (
                      <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Microscope className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground">{student?.full_name}</span>
                            <span className="text-xs text-muted-foreground">{student?.roll_number}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Hospital className="w-3.5 h-3.5" />{item.referral_hospital}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{format(parseISO(item.created_at), "dd MMM, hh:mm a")}</span>
                          </div>
                          {testDetails && (
                            <div className="flex items-center gap-1.5">
                              <ClipboardList className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-sm text-blue-700 dark:text-blue-300">{testDetails}</span>
                            </div>
                          )}
                          {item.illness_description && <p className="text-sm text-muted-foreground line-clamp-1">{item.illness_description}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {getStatusBadge(item.status)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* On-Campus List */}
            {activeCard === "on-campus" && (
              filteredOnCampus.length === 0 ? (
                <EmptyState label="No on-campus prescriptions found" />
              ) : (
                <div className="space-y-3">
                  {filteredOnCampus.map(item => {
                    const student = item.student;
                    const apt = item.appointments as any;
                    const medicines = (item.prescription_items as any[]) || [];
                    const medicineList = medicines.map(m => m.medicine_name).join(", ");
                    return (
                      <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <HeartPulse className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground">{student?.full_name}</span>
                            <span className="text-xs text-muted-foreground">{student?.roll_number}</span>
                            {student?.program && <Badge variant="outline" className="text-xs">{student.program}{student.branch ? ` - ${student.branch}` : ""}</Badge>}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{format(parseISO(item.created_at), "dd MMM, hh:mm a")}</span>
                            {apt?.reason && <span className="text-xs">{apt.reason}</span>}
                          </div>
                          {item.diagnosis && (
                            <p className="text-sm text-muted-foreground"><span className="font-medium">Diagnosis:</span> {item.diagnosis}</p>
                          )}
                          {medicineList && (
                            <div className="flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-300">
                              <Pill className="w-3.5 h-3.5" />
                              <span className="line-clamp-1">{medicineList}</span>
                            </div>
                          )}
                          {item.notes && <p className="text-xs text-muted-foreground/70 line-clamp-1">{item.notes}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <Badge variant="secondary" className="text-xs">Prescribed</Badge>
                          {medicines.length > 0 && (
                            <span className="text-xs text-muted-foreground">{medicines.length} medicine{medicines.length !== 1 ? "s" : ""}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <FileText className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground font-medium">{label}</p>
      <p className="text-sm text-muted-foreground/70 mt-1">Records will appear here when available</p>
    </div>
  );
}
