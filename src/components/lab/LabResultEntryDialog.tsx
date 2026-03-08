import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Printer, Save, User, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  student_id: string;
  doctor_id: string | null;
  student?: { full_name: string; roll_number: string; branch: string | null; program: string };
  doctor?: { name: string; designation: string };
}

// Common lab test parameter templates
const testTemplates: Record<string, Array<{ name: string; unit: string; refRange: string }>> = {
  "Complete Blood Count (CBC)": [
    { name: "Hemoglobin", unit: "g/dL", refRange: "12.0-15.0" },
    { name: "RBC Count", unit: "million/µL", refRange: "4.2-5.4" },
    { name: "WBC Total", unit: "/µL", refRange: "4,000-10,000" },
    { name: "Neutrophils", unit: "%", refRange: "40-70" },
    { name: "Lymphocytes", unit: "%", refRange: "20-40" },
    { name: "Monocytes", unit: "%", refRange: "2-8" },
    { name: "Eosinophils", unit: "%", refRange: "1-4" },
    { name: "Basophils", unit: "%", refRange: "0-1" },
    { name: "Platelets", unit: "L/µL", refRange: "1.5-4.5" },
    { name: "ESR", unit: "mm/hr", refRange: "0-20" },
  ],
  "Liver Function Test (LFT)": [
    { name: "Total Protein", unit: "g/dL", refRange: "6.0-8.3" },
    { name: "Albumin", unit: "g/dL", refRange: "3.5-5.0" },
    { name: "Total Bilirubin", unit: "mg/dL", refRange: "0.1-1.2" },
    { name: "Direct Bilirubin", unit: "mg/dL", refRange: "0.0-0.3" },
    { name: "ALT (SGPT)", unit: "U/L", refRange: "7-56" },
    { name: "AST (SGOT)", unit: "U/L", refRange: "5-40" },
    { name: "ALP", unit: "U/L", refRange: "40-130" },
    { name: "GGT", unit: "U/L", refRange: "9-48" },
  ],
  "Thyroid Profile": [
    { name: "T3", unit: "ng/dL", refRange: "80-200" },
    { name: "T4", unit: "µg/dL", refRange: "5.0-12.0" },
    { name: "TSH", unit: "µIU/mL", refRange: "0.5-4.5" },
  ],
  "Lipid Profile": [
    { name: "Total Cholesterol", unit: "mg/dL", refRange: "<200" },
    { name: "LDL", unit: "mg/dL", refRange: "<100" },
    { name: "HDL", unit: "mg/dL", refRange: ">40" },
    { name: "Triglycerides", unit: "mg/dL", refRange: "<150" },
    { name: "VLDL", unit: "mg/dL", refRange: "<30" },
  ],
  "Blood Sugar": [
    { name: "Fasting Blood Sugar", unit: "mg/dL", refRange: "70-100" },
    { name: "Post Prandial Blood Sugar", unit: "mg/dL", refRange: "<140" },
    { name: "HbA1c", unit: "%", refRange: "<5.7" },
  ],
};

interface Props {
  report: LabReport;
  open: boolean;
  onClose: () => void;
  onUpload: (report: LabReport, file: File) => void;
  uploadingId: string | null;
  onRefresh: () => void;
}

export default function LabResultEntryDialog({ report, open, onClose, onUpload, uploadingId, onRefresh }: Props) {
  const { toast } = useToast();
  const template = Object.entries(testTemplates).find(([key]) => 
    report.test_name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(report.test_name.toLowerCase())
  );
  const params = template ? template[1] : [];
  
  const [results, setResults] = useState<Record<string, string>>({});
  const [techNotes, setTechNotes] = useState("");
  const [sampleOk, setSampleOk] = useState(true);
  const [saving, setSaving] = useState(false);

  const updateResult = (name: string, value: string) => {
    setResults(prev => ({ ...prev, [name]: value }));
  };

  const getFlagForValue = (value: string, refRange: string): "normal" | "low" | "high" | "" => {
    if (!value) return "";
    const num = parseFloat(value);
    if (isNaN(num)) return "";
    
    if (refRange.startsWith("<")) {
      return num >= parseFloat(refRange.slice(1)) ? "high" : "normal";
    }
    if (refRange.startsWith(">")) {
      return num <= parseFloat(refRange.slice(1)) ? "low" : "normal";
    }
    const parts = refRange.split("-").map(s => parseFloat(s.replace(/,/g, "")));
    if (parts.length === 2) {
      if (num < parts[0]) return "low";
      if (num > parts[1]) return "high";
      return "normal";
    }
    return "";
  };

  const handleSaveResults = async () => {
    setSaving(true);
    try {
      const resultText = params.map(p => {
        const val = results[p.name] || "-";
        const flag = getFlagForValue(val, p.refRange);
        return `${p.name}: ${val} ${p.unit} (Ref: ${p.refRange})${flag === "high" ? " ↑ HIGH" : flag === "low" ? " ↓ LOW" : ""}`;
      }).join("\n");

      const fullNotes = `LAB RESULTS:\n${resultText}\n\nTechnician Notes: ${techNotes || "None"}\nSample Quality: ${sampleOk ? "OK" : "Issue noted"}`;

      const { error } = await supabase.from("lab_reports").update({
        notes: fullNotes,
        status: "completed",
        updated_at: new Date().toISOString(),
      }).eq("id", report.id);

      if (error) throw error;

      // Notify student
      const { data: student } = await supabase.from("students").select("user_id").eq("id", report.student_id).single();
      if (student?.user_id) {
        await supabase.from("notifications").insert({
          user_id: student.user_id,
          title: "🔬 Lab Report Ready",
          message: `Your ${report.test_name} results are ready. Please check your health records.`,
          type: "lab_report",
        });
      }

      toast({ title: "✅ Results Saved", description: `${report.test_name} results saved for ${report.student?.full_name}` });
      onRefresh();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePrintReport = async () => {
    const reportNo = `LR/${format(new Date(), "yyyyMMdd")}/${report.id.slice(0, 6).toUpperCase()}`;
    const rowsHtml = params.map(p => {
      const val = results[p.name] || "-";
      const flag = getFlagForValue(val, p.refRange);
      return `<tr>
        <td>${p.name}</td>
        <td><strong>${val}</strong></td>
        <td>${p.unit}</td>
        <td>${p.refRange}</td>
        <td>${flag === "high" ? '<span style="color:red">↑ HIGH</span>' : flag === "low" ? '<span style="color:red">↓ LOW</span>' : flag === "normal" ? '<span style="color:green">✓ Normal</span>' : "-"}</td>
      </tr>`;
    }).join("");

    const bodyHtml = `
      ${getNitwHeaderHtml("LABORATORY REPORT")}
      <div class="doc-title">
        <h3>LABORATORY INVESTIGATION REPORT</h3>
        <div class="cert-no">Report No.: ${reportNo}</div>
      </div>
      <div class="section">
        <div class="section-title">PATIENT DETAILS</div>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Patient Name:</span><span>${report.student?.full_name || "N/A"}</span></div>
          <div class="info-item"><span class="info-label">Roll Number:</span><span>${report.student?.roll_number || "N/A"}</span></div>
          <div class="info-item"><span class="info-label">Programme:</span><span>${report.student?.program || "N/A"}</span></div>
          <div class="info-item"><span class="info-label">Branch:</span><span>${report.student?.branch || "N/A"}</span></div>
          <div class="info-item"><span class="info-label">Referring Doctor:</span><span>Dr. ${report.doctor?.name || "N/A"}</span></div>
          <div class="info-item"><span class="info-label">Test Date:</span><span>${format(new Date(report.created_at), "dd MMM yyyy")}</span></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">TEST: ${report.test_name.toUpperCase()}</div>
        <table>
          <thead><tr><th>Parameter</th><th>Result</th><th>Unit</th><th>Reference Range</th><th>Flag</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
      ${techNotes ? `<div class="notes-box"><strong>Technician Notes:</strong> ${techNotes}</div>` : ""}
      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">Lab Technician</div>
          <div class="doctor-type">NIT Warangal Health Centre</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Pathologist</div>
          <div class="doctor-type">NIT Warangal Health Centre</div>
        </div>
      </div>
    `;

    await printDocument({
      title: `Lab Report — ${report.student?.full_name}`,
      bodyHtml,
      documentId: reportNo,
      documentType: "LAB_REPORT",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-blue-600" />
            Enter Lab Results — {report.test_name}
          </DialogTitle>
        </DialogHeader>

        {/* Patient Info */}
        <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
          <User className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">{report.student?.full_name} ({report.student?.roll_number})</p>
            <p className="text-xs text-muted-foreground">{report.student?.program} • {report.student?.branch || "N/A"}</p>
          </div>
          {report.notes && !report.notes.startsWith("LAB RESULTS") && (
            <Badge variant="outline" className="ml-auto text-xs">Indication: {report.notes}</Badge>
          )}
        </div>

        {/* Parameters table */}
        {params.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-2 font-medium">Parameter</th>
                  <th className="text-left p-2 font-medium w-24">Result</th>
                  <th className="text-left p-2 font-medium w-16">Unit</th>
                  <th className="text-left p-2 font-medium w-28">Ref. Range</th>
                  <th className="text-left p-2 font-medium w-16">Flag</th>
                </tr>
              </thead>
              <tbody>
                {params.map((p) => {
                  const flag = getFlagForValue(results[p.name] || "", p.refRange);
                  return (
                    <tr key={p.name} className={`border-t ${flag === "high" || flag === "low" ? "bg-red-50" : ""}`}>
                      <td className="p-2">{p.name}</td>
                      <td className="p-2">
                        <Input
                          type="text"
                          value={results[p.name] || ""}
                          onChange={e => updateResult(p.name, e.target.value)}
                          className="h-7 text-sm"
                          placeholder="—"
                        />
                      </td>
                      <td className="p-2 text-muted-foreground text-xs">{p.unit}</td>
                      <td className="p-2 text-muted-foreground text-xs">{p.refRange}</td>
                      <td className="p-2">
                        {flag === "high" && <Badge className="bg-red-100 text-red-700 text-[10px]">↑ HIGH</Badge>}
                        {flag === "low" && <Badge className="bg-red-100 text-red-700 text-[10px]">↓ LOW</Badge>}
                        {flag === "normal" && <Badge className="bg-green-100 text-green-700 text-[10px]">✓</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border rounded-lg p-4 text-center text-muted-foreground text-sm">
            <p>No predefined template for "{report.test_name}". Use the notes field below or upload a file.</p>
          </div>
        )}

        {/* Quality check */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox checked={sampleOk} onCheckedChange={(c) => setSampleOk(!!c)} id="sample-ok" />
            <Label htmlFor="sample-ok" className="text-sm">Sample quality OK</Label>
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label className="text-sm">Technician Notes</Label>
          <Textarea value={techNotes} onChange={e => setTechNotes(e.target.value)} placeholder="Additional observations..." rows={2} className="mt-1" />
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={handlePrintReport} disabled={params.length === 0 && !techNotes}>
            <Printer className="w-4 h-4 mr-1" />
            Print Report
          </Button>
          <label className="cursor-pointer">
            <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(report, f); }} disabled={uploadingId === report.id} />
            <Button variant="outline" asChild disabled={uploadingId === report.id}>
              <span><Upload className="w-4 h-4 mr-1" />{uploadingId === report.id ? "Uploading..." : "Upload File"}</span>
            </Button>
          </label>
          <Button onClick={handleSaveResults} disabled={saving}>
            <Save className="w-4 h-4 mr-1" />
            {saving ? "Saving..." : "Save & Complete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
