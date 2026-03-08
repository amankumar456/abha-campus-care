import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, FileText, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LabReport {
  id: string;
  test_name: string;
  status: string;
  created_at: string;
  student_id: string;
  student?: { full_name: string; roll_number: string; branch: string | null; program: string };
}

interface Props {
  reports: LabReport[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function LabStudentRecords({ reports, searchQuery, onSearchChange }: Props) {
  const navigate = useNavigate();

  // Group by student
  const studentMap = new Map<string, { student: LabReport["student"]; rollNumber: string; total: number; pending: number; completed: number }>();
  reports.forEach(r => {
    if (!r.student) return;
    const key = r.student.roll_number;
    const existing = studentMap.get(key);
    if (existing) {
      existing.total++;
      if (r.status === "pending") existing.pending++;
      else existing.completed++;
    } else {
      studentMap.set(key, {
        student: r.student,
        rollNumber: r.student.roll_number,
        total: 1,
        pending: r.status === "pending" ? 1 : 0,
        completed: r.status === "completed" ? 1 : 0,
      });
    }
  });

  const students = Array.from(studentMap.values()).filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.student?.full_name?.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <User className="w-5 h-5" />
        Student Directory — Lab Records
      </h2>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search students..." value={searchQuery} onChange={e => onSearchChange(e.target.value)} className="pl-10" />
      </div>

      {students.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No student records found</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {students.map(s => (
            <Card key={s.rollNumber} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/student-profile/${s.rollNumber}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{s.student?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{s.rollNumber} • {s.student?.program}</p>
                    {s.student?.branch && <p className="text-xs text-muted-foreground">{s.student.branch}</p>}
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline" className="text-xs"><FileText className="w-3 h-3 mr-1" />{s.total} tests</Badge>
                  {s.pending > 0 && <Badge className="bg-amber-100 text-amber-700 text-xs">{s.pending} pending</Badge>}
                  {s.completed > 0 && <Badge className="bg-emerald-100 text-emerald-700 text-xs">{s.completed} done</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
