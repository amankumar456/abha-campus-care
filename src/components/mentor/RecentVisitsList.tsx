import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";

interface HealthVisit {
  id: string;
  visit_date: string;
  reason_category: string;
  student_id: string;
  follow_up_required?: boolean;
  follow_up_date?: string | null;
}

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
}

interface RecentVisitsListProps {
  visits: HealthVisit[];
  students: Student[];
}

const getReasonLabel = (reason: string) => {
  const labels: Record<string, string> = {
    medical_illness: "Medical Illness",
    injury: "Injury",
    mental_wellness: "Mental Wellness",
    vaccination: "Vaccination",
    routine_checkup: "Routine Checkup",
    other: "Other",
  };
  return labels[reason] || reason;
};

const getReasonColor = (reason: string) => {
  const colors: Record<string, string> = {
    medical_illness: "bg-red-100 text-red-800 border-red-200",
    injury: "bg-orange-100 text-orange-800 border-orange-200",
    mental_wellness: "bg-purple-100 text-purple-800 border-purple-200",
    vaccination: "bg-green-100 text-green-800 border-green-200",
    routine_checkup: "bg-blue-100 text-blue-800 border-blue-200",
    other: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colors[reason] || colors.other;
};

export default function RecentVisitsList({ visits, students }: RecentVisitsListProps) {
  const getStudentInfo = (studentId: string) => {
    return students.find(s => s.id === studentId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-secondary" />
          Recent Health Visits
        </CardTitle>
        <CardDescription>Latest health centre visits by your mentees</CardDescription>
      </CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No recent visits recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((visit) => {
              const student = getStudentInfo(visit.student_id);
              return (
                <div
                  key={visit.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{student?.full_name || "Unknown Student"}</p>
                        {student && (
                          <span className="text-xs text-muted-foreground">
                            ({student.roll_number})
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge className={`text-xs ${getReasonColor(visit.reason_category)}`}>
                          {getReasonLabel(visit.reason_category)}
                        </Badge>
                        {visit.follow_up_required ? (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Follow-up Required
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      {visit.follow_up_date && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Follow-up on: {new Date(visit.follow_up_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(visit.visit_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
