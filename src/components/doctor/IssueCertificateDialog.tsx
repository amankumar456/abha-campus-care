import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileCheck, User, Search, Printer, Download, Check, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface IssueCertificateDialogProps {
  trigger: React.ReactNode;
  doctorId: string | null;
  doctorProfile?: {
    name: string;
    designation: string;
    qualification: string;
  } | null;
}

// Pre-loaded test students
const testStudents = [
  { id: "s1", name: "Aman Kumar", rollNumber: "25EDI0022", branch: "Electronics", year: "1st Year" },
  { id: "s2", name: "Micheal Alvi", rollNumber: "25EDI0004", branch: "Computer Science", year: "1st Year" },
  { id: "s3", name: "Sudipta Maya", rollNumber: "25EDI0013", branch: "Mechanical", year: "1st Year" },
  { id: "s4", name: "Sneha Kumari", rollNumber: "25EDI0012", branch: "Electrical", year: "1st Year" },
  { id: "s5", name: "Shubham Giri", rollNumber: "25EDI0002", branch: "Civil", year: "1st Year" },
];

const certificateTypes = [
  { value: "fitness", label: "Fitness Certificate", description: "Certifies student is fit to resume activities" },
  { value: "medical", label: "Medical Certificate", description: "Documents medical consultation/treatment" },
  { value: "vaccination", label: "Vaccination Certificate", description: "Confirms vaccination status" },
  { value: "examination", label: "Medical Examination", description: "Pre-examination health clearance" },
];

export default function IssueCertificateDialog({ trigger, doctorId, doctorProfile }: IssueCertificateDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<typeof testStudents[0] | null>(null);
  const [certificateType, setCertificateType] = useState("");
  const [examinationDate, setExaminationDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [findings, setFindings] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch real students from database
  const { data: dbStudents } = useQuery({
    queryKey: ["students-for-certificate", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      const { data } = await supabase
        .from("students")
        .select("id, full_name, roll_number, branch, year_of_study")
        .or(`roll_number.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .limit(5);
      return data?.map((s) => ({
        id: s.id,
        name: s.full_name,
        rollNumber: s.roll_number,
        branch: s.branch || "Not specified",
        year: s.year_of_study || "Not specified",
      })) || [];
    },
    enabled: searchTerm.length >= 2,
  });

  // Combine test students with real students
  const filteredStudents = searchTerm.length >= 2
    ? [...testStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
      ), ...(dbStudents || [])]
    : testStudents;

  const handleGenerateCertificate = async () => {
    if (!selectedStudent || !certificateType) {
      toast({
        title: "Missing Information",
        description: "Please select a student and certificate type.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setShowPreview(true);
    setIsGenerating(false);
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Medical Certificate - ${selectedStudent?.name}</title>
              <style>
                body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { color: #1e3a5f; margin: 0; font-size: 24px; }
                .header p { margin: 5px 0; color: #666; }
                .content { line-height: 1.8; }
                .field { margin: 15px 0; }
                .field-label { font-weight: bold; }
                .signature { margin-top: 60px; text-align: right; }
                .stamp { border: 2px solid #1e3a5f; border-radius: 50%; width: 100px; height: 100px; display: inline-flex; align-items: center; justify-content: center; text-align: center; font-size: 10px; color: #1e3a5f; margin-right: 30px; }
                .certificate-number { font-size: 12px; color: #888; margin-top: 10px; }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }

    toast({
      title: "Certificate Generated",
      description: `Medical certificate for ${selectedStudent?.name} has been sent to print.`,
    });
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setCertificateType("");
    setFindings("");
    setRemarks("");
    setShowPreview(false);
    setSearchTerm("");
  };

  const getCertificateTitle = () => {
    return certificateTypes.find((t) => t.value === certificateType)?.label || "Medical Certificate";
  };

  const certificateNumber = `MC/${format(new Date(), "yyyyMMdd")}/${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-muted-foreground" />
            Issue Medical Certificate
          </DialogTitle>
          <DialogDescription>
            Generate and print official medical certificates for students.
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-6 mt-4">
            {/* Student Search */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Search Student *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or roll number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Student List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {filteredStudents.slice(0, 6).map((student) => (
                  <Card
                    key={student.id}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary",
                      selectedStudent?.id === student.id && "border-primary bg-primary/5"
                    )}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{student.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.rollNumber} • {student.branch}
                          </p>
                        </div>
                        {selectedStudent?.id === student.id && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Certificate Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Certificate Type *</Label>
              <div className="grid grid-cols-2 gap-2">
                {certificateTypes.map((type) => (
                  <Card
                    key={type.value}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary",
                      certificateType === type.value && "border-primary bg-primary/5"
                    )}
                    onClick={() => setCertificateType(type.value)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                        {certificateType === type.value && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Examination Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Examination Date</Label>
                <Input
                  type="date"
                  value={examinationDate}
                  onChange={(e) => setExaminationDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Clinical Findings</Label>
              <Textarea
                placeholder="Enter clinical findings and observations..."
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Remarks / Recommendations</Label>
              <Textarea
                placeholder="Any additional remarks or recommendations..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="min-h-[60px]"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateCertificate} disabled={isGenerating || !selectedStudent || !certificateType}>
                {isGenerating ? "Generating..." : "Preview Certificate"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Certificate Preview */}
            <div ref={printRef} className="border rounded-lg p-8 bg-white">
              {/* Header */}
              <div className="text-center border-b-2 border-primary pb-6 mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Stethoscope className="w-8 h-8 text-primary" />
                  <div>
                    <h1 className="text-xl font-bold text-primary">NATIONAL INSTITUTE OF TECHNOLOGY</h1>
                    <p className="text-sm text-muted-foreground">WARANGAL, TELANGANA - 506004</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-secondary mt-4">HEALTH CENTRE</p>
                <p className="text-sm text-muted-foreground">Phone: 0870-2462022 | Email: healthcentre@nitw.ac.in</p>
              </div>

              {/* Certificate Title */}
              <div className="text-center mb-8">
                <h2 className="text-lg font-bold uppercase tracking-wide border-b-2 border-muted inline-block pb-1">
                  {getCertificateTitle()}
                </h2>
                <p className="text-xs text-muted-foreground mt-2">Certificate No: {certificateNumber}</p>
              </div>

              {/* Certificate Body */}
              <div className="space-y-4 text-sm leading-relaxed">
                <p>This is to certify that:</p>

                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <p><span className="font-semibold">Name:</span> {selectedStudent?.name}</p>
                  <p><span className="font-semibold">Roll Number:</span> {selectedStudent?.rollNumber}</p>
                  <p><span className="font-semibold">Department:</span> {selectedStudent?.branch}</p>
                  <p><span className="font-semibold">Year of Study:</span> {selectedStudent?.year}</p>
                </div>

                <p>
                  Was examined on <span className="font-semibold">{format(new Date(examinationDate), "PPPP")}</span> at the 
                  Health Centre, NIT Warangal.
                </p>

                {findings && (
                  <div>
                    <p className="font-semibold">Clinical Findings:</p>
                    <p className="ml-4">{findings || "General health assessment completed. No significant abnormalities detected."}</p>
                  </div>
                )}

                {certificateType === "fitness" && (
                  <p className="font-semibold text-secondary">
                    The above-mentioned student is hereby certified to be medically fit to resume regular academic activities 
                    and participate in curricular/extracurricular programs.
                  </p>
                )}

                {remarks && (
                  <div>
                    <p className="font-semibold">Remarks:</p>
                    <p className="ml-4">{remarks}</p>
                  </div>
                )}
              </div>

              {/* Signature Section */}
              <div className="mt-12 flex items-end justify-between">
                {/* NIT Warangal Official Emblem */}
                <div className="text-center">
                  <img 
                    src="/nitw-emblem.png" 
                    alt="NIT Warangal Official Emblem" 
                    className="w-20 h-24 object-contain mx-auto"
                  />
                  <p className="text-[9px] text-muted-foreground mt-1">Official Emblem</p>
                </div>

                {/* Doctor Signature */}
                <div className="text-right">
                  <p className="font-script text-2xl text-primary mb-2" style={{ fontFamily: "'Brush Script MT', cursive" }}>
                    {doctorProfile?.name || "Dr. Medical Officer"}
                  </p>
                  <p className="font-semibold">{doctorProfile?.name || "Medical Officer"}</p>
                  <p className="text-sm text-muted-foreground">{doctorProfile?.designation || "Chief Medical Officer"}</p>
                  <p className="text-sm text-muted-foreground">{doctorProfile?.qualification || "MBBS, MD (General Medicine)"}</p>
                  <p className="text-sm text-muted-foreground">Health Centre, NIT Warangal</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  Date of Issue: {format(new Date(), "PPPP")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This certificate is valid for official purposes. For verification, contact Health Centre, NIT Warangal.
                </p>
              </div>
            </div>

            {/* Print Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                ← Back to Edit
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Certificate
                </Button>
                <Button onClick={() => { handlePrint(); setOpen(false); resetForm(); }}>
                  <Download className="w-4 h-4 mr-2" />
                  Issue & Download
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
