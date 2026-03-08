import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Download, User, Calendar, Search, Printer, Eye, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { printDocument, getNitwHeaderHtml } from "@/lib/print/printDocument";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generateLabReportPdf } from "@/lib/print/generateLabReportPdf";

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

const getSignedUrl = async (storagePath: string): Promise<string | null> => {
  // If it's already a full URL (legacy data), return as-is
  if (storagePath.startsWith("http")) return storagePath;
  const { data, error } = await supabase.storage.from("lab-reports").createSignedUrl(storagePath, 3600);
  if (error) { console.error("Signed URL error:", error); return null; }
  return data.signedUrl;
};

export default function LabCompletedTests({ reports, searchQuery, onSearchChange }: Props) {
  const { toast } = useToast();
  const [viewReport, setViewReport] = useState<LabReport | null>(null);

  const filtered = reports.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return r.student?.full_name?.toLowerCase().includes(q) || 
           r.student?.roll_number?.toLowerCase().includes(q) || 
           r.test_name.toLowerCase().includes(q);
  });

  const handleViewFile = async (r: LabReport) => {
    if (!r.report_file_url) return;
    const url = await getSignedUrl(r.report_file_url);
    if (url) window.open(url, "_blank");
    else toast({ title: "Error", description: "Could not load file", variant: "destructive" });
  };

  const handlePrint = async (r: LabReport) => {
    const reportNo = `LR/${format(new Date(r.created_at), "yyyyMMdd")}/${r.id.slice(0, 6).toUpperCase()}`;

    // Get signed URL for embedding in print
    let fileEmbed = "";
    if (r.report_file_url) {
      const url = await getSignedUrl(r.report_file_url);
      if (url) {
        const isPdf = r.report_file_name?.toLowerCase().endsWith(".pdf");
        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(r.report_file_name || "");
        if (isPdf) {
          fileEmbed = `<div class="section"><div class="section-title">ATTACHED REPORT</div><iframe src="${url}" style="width:100%;height:600px;border:1px solid #ddd;border-radius:4px;" title="Lab Report"></iframe></div>`;
        } else if (isImage) {
          fileEmbed = `<div class="section"><div class="section-title">ATTACHED REPORT</div><img src="${url}" style="max-width:100%;border:1px solid #ddd;border-radius:4px;" alt="Lab Report" /></div>`;
        } else {
          fileEmbed = `<div class="section"><div class="section-title">ATTACHED REPORT</div><div class="info-box"><strong>File:</strong> ${r.report_file_name}<br/><a href="${url}" target="_blank">Download File</a></div></div>`;
        }
      }
    }

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
      ${fileEmbed}
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
                    {r.report_file_url ? (
                      <Button variant="outline" size="sm" onClick={() => handleViewFile(r)}>
                        <Eye className="w-3 h-3 mr-1" />View PDF
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setViewReport(r)}>
                        <Eye className="w-3 h-3 mr-1" />View Results
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => r.report_file_url ? handleViewFile(r) : handlePrint(r)}>
                      <Printer className="w-3 h-3 mr-1" />Print
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Results Dialog */}
      {viewReport && (
        <Dialog open={!!viewReport} onOpenChange={() => setViewReport(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-600" />
                Lab Results — {viewReport.test_name}
              </DialogTitle>
            </DialogHeader>
            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{viewReport.student?.full_name} ({viewReport.student?.roll_number})</p>
                <p className="text-xs text-muted-foreground">{viewReport.student?.program} • {viewReport.student?.branch || "N/A"}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              Completed: {format(new Date(viewReport.updated_at), "dd MMM yyyy, hh:mm a")}
            </div>
            {viewReport.notes ? (
              <div className="border rounded-lg p-4 text-sm whitespace-pre-line bg-background">
                {viewReport.notes}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No entered results. Check attached file.</p>
            )}
            <div className="flex gap-2 justify-end">
              {viewReport.report_file_url && (
                <Button variant="default" size="sm" onClick={() => handleViewFile(viewReport)}>
                  <Eye className="w-4 h-4 mr-1" />Open PDF Report
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => handlePrint(viewReport)}>
                <Printer className="w-4 h-4 mr-1" />Print
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
