import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Download, User, Calendar, Search, Printer } from "lucide-react";
import { format } from "date-fns";
import { printDocument, getNitwHeaderHtml } from "@/lib/print/printDocument";

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
  student?: { full_name: string; roll_number: string; branch: string | null; program: string };
  doctor?: { name: string; designation: string };
}

interface Props {
  reports: LabReport[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function LabCompletedTests({ reports, searchQuery, onSearchChange }: Props) {
  const filtered = reports.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return r.student?.full_name?.toLowerCase().includes(q) || 
           r.student?.roll_number?.toLowerCase().includes(q) || 
           r.test_name.toLowerCase().includes(q);
  });

  const handlePrint = async (r: LabReport) => {
    const reportNo = `LR/${format(new Date(r.created_at), "yyyyMMdd")}/${r.id.slice(0, 6).toUpperCase()}`;
    const bodyHtml = `
      ${getNitwHeaderHtml("LABORATORY REPORT")}
      <div class="doc-title">
        <h3>LABORATORY INVESTIGATION REPORT</h3>
        <div class="cert-no">Report No.: ${reportNo}</div>
      </div>
      <div class="section">
        <div class="section-title">PATIENT DETAILS</div>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Patient Name:</span><span>${r.student?.full_name || "N/A"}</span></div>
          <div class="info-item"><span class="info-label">Roll Number:</span><span>${r.student?.roll_number || "N/A"}</span></div>
          <div class="info-item"><span class="info-label">Programme:</span><span>${r.student?.program || "N/A"}</span></div>
          <div class="info-item"><span class="info-label">Referring Doctor:</span><span>Dr. ${r.doctor?.name || "N/A"}</span></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">TEST: ${r.test_name.toUpperCase()}</div>
        <div class="body-text" style="white-space:pre-line">${r.notes || "Results attached as file."}</div>
      </div>
      <div class="signature-section">
        <div class="signature-box"><div class="signature-line">Lab Technician</div></div>
        <div class="signature-box"><div class="signature-line">Pathologist</div></div>
      </div>
    `;
    await printDocument({ title: `Lab Report — ${r.student?.full_name}`, bodyHtml, documentId: reportNo, documentType: "LAB_REPORT" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">✅ Completed Tests</h2>
        <Badge className="bg-emerald-100 text-emerald-700">{filtered.length} completed</Badge>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search completed tests..." value={searchQuery} onChange={e => onSearchChange(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No completed reports</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <Card key={r.id} className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{r.student?.full_name}</span>
                      <Badge variant="outline" className="text-xs">{r.student?.roll_number}</Badge>
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">{r.test_name}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(r.updated_at), "dd MMM yyyy, hh:mm a")}</span>
                      <span><CheckCircle2 className="w-3 h-3 inline text-emerald-500" /> Verified</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.report_file_url && (
                      <a href={r.report_file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm"><Download className="w-3 h-3 mr-1" />View File</Button>
                      </a>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handlePrint(r)}>
                      <Printer className="w-3 h-3 mr-1" />Print
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
