import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, Building2, Calendar, User, GraduationCap, FileText, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface LeaveLetterData {
  id: string;
  studentName: string;
  rollNumber: string;
  program: string;
  branch?: string | null;
  batch?: string;
  referralHospital: string;
  illnessDescription?: string | null;
  doctorName?: string | null;
  referralDate: string;
  leaveStartDate?: string | null;
  expectedReturnDate?: string | null;
  restDays?: number | null;
  doctorNotes?: string | null;
  approvalDate?: string | null;
  status: string;
}

interface PrintableLeaveLetterProps {
  leaveData: LeaveLetterData;
  onClose?: () => void;
}

const PrintableLeaveLetter = ({ leaveData, onClose }: PrintableLeaveLetterProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medical Leave Letter - ${leaveData.studentName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Times New Roman', serif;
              padding: 40px;
              line-height: 1.6;
              color: #1a1a1a;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #0066cc;
              padding-bottom: 20px;
            }
            .header h1 {
              font-size: 24px;
              color: #003366;
              margin-bottom: 5px;
            }
            .header h2 {
              font-size: 18px;
              color: #0066cc;
              font-weight: normal;
            }
            .header p {
              font-size: 12px;
              color: #666;
              margin-top: 5px;
            }
            .title {
              text-align: center;
              margin: 25px 0;
            }
            .title h3 {
              font-size: 20px;
              text-decoration: underline;
              color: #003366;
            }
            .ref-date {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              font-size: 14px;
            }
            .content {
              margin: 20px 0;
            }
            .section {
              margin-bottom: 20px;
            }
            .section-title {
              font-weight: bold;
              color: #003366;
              margin-bottom: 10px;
              font-size: 14px;
              text-transform: uppercase;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            .info-item {
              display: flex;
            }
            .info-label {
              font-weight: bold;
              min-width: 150px;
              color: #333;
            }
            .info-value {
              color: #1a1a1a;
            }
            .full-width {
              grid-column: 1 / -1;
            }
            .body-text {
              text-align: justify;
              margin: 20px 0;
              font-size: 14px;
            }
            .signature-section {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              text-align: center;
              min-width: 200px;
            }
            .signature-line {
              border-top: 1px solid #333;
              margin-top: 50px;
              padding-top: 5px;
            }
            .stamp-area {
              border: 2px dashed #ccc;
              width: 120px;
              height: 120px;
              margin: 0 auto;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #999;
              font-size: 12px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              font-size: 11px;
              color: #666;
              text-align: center;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-approved {
              background: #d4edda;
              color: #155724;
            }
            .status-pending {
              background: #fff3cd;
              color: #856404;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleDownloadPDF = () => {
    // For now, trigger print which can save as PDF
    handlePrint();
  };

  const isApproved = leaveData.status === "on_leave" || leaveData.status === "returned";
  const currentDate = format(new Date(), "PPP");

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Medical Leave Letter</CardTitle>
              <p className="text-sm text-muted-foreground">
                Official document for academic department submission
              </p>
            </div>
          </div>
          <Badge 
            className={isApproved 
              ? "bg-green-100 text-green-800" 
              : "bg-amber-100 text-amber-800"
            }
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {isApproved ? "Approved" : "Pending"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 print:hidden">
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print Letter
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Save as PDF
          </Button>
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="ml-auto">
              Close Preview
            </Button>
          )}
        </div>

        {/* Printable Content */}
        <div 
          ref={printRef} 
          className="bg-white border rounded-lg p-8 shadow-sm"
          style={{ minHeight: "842px" }} // A4 aspect
        >
          {/* Header */}
          <div className="header text-center mb-6 pb-4 border-b-2 border-primary">
            <h1 className="text-2xl font-bold text-primary mb-1">
              NATIONAL INSTITUTE OF TECHNOLOGY WARANGAL
            </h1>
            <h2 className="text-lg text-primary/80">Health Centre</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Warangal, Telangana - 506004 | health.centre@nitw.ac.in
            </p>
          </div>

          {/* Title */}
          <div className="text-center my-6">
            <h3 className="text-xl font-semibold underline text-primary">
              MEDICAL LEAVE CERTIFICATE
            </h3>
          </div>

          {/* Reference & Date */}
          <div className="flex justify-between text-sm mb-6">
            <div>
              <span className="font-semibold">Ref No:</span> NITW/HC/ML/{leaveData.id.slice(0, 8).toUpperCase()}
            </div>
            <div>
              <span className="font-semibold">Date:</span> {currentDate}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Student Details */}
          <div className="mb-6">
            <h4 className="font-semibold text-sm uppercase text-primary border-b pb-2 mb-3 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Student Information
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex">
                <span className="font-semibold min-w-[140px]">Name:</span>
                <span>{leaveData.studentName}</span>
              </div>
              <div className="flex">
                <span className="font-semibold min-w-[140px]">Roll Number:</span>
                <span>{leaveData.rollNumber}</span>
              </div>
              <div className="flex">
                <span className="font-semibold min-w-[140px]">Program:</span>
                <span>{leaveData.program}</span>
              </div>
              {leaveData.branch && (
                <div className="flex">
                  <span className="font-semibold min-w-[140px]">Branch:</span>
                  <span>{leaveData.branch}</span>
                </div>
              )}
            </div>
          </div>

          {/* Medical Details */}
          <div className="mb-6">
            <h4 className="font-semibold text-sm uppercase text-primary border-b pb-2 mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Medical Details
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex">
                <span className="font-semibold min-w-[140px]">Hospital:</span>
                <span>{leaveData.referralHospital}</span>
              </div>
              <div className="flex">
                <span className="font-semibold min-w-[140px]">Referring Doctor:</span>
                <span>{leaveData.doctorName || "Campus Medical Officer"}</span>
              </div>
              {leaveData.illnessDescription && (
                <div className="flex col-span-2">
                  <span className="font-semibold min-w-[140px]">Condition:</span>
                  <span>{leaveData.illnessDescription}</span>
                </div>
              )}
            </div>
          </div>

          {/* Leave Period */}
          <div className="mb-6">
            <h4 className="font-semibold text-sm uppercase text-primary border-b pb-2 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Leave Period
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex">
                <span className="font-semibold min-w-[140px]">Referral Date:</span>
                <span>{format(new Date(leaveData.referralDate), "PPP")}</span>
              </div>
              {leaveData.leaveStartDate && (
                <div className="flex">
                  <span className="font-semibold min-w-[140px]">Leave From:</span>
                  <span>{format(new Date(leaveData.leaveStartDate), "PPP")}</span>
                </div>
              )}
              {leaveData.expectedReturnDate && (
                <div className="flex">
                  <span className="font-semibold min-w-[140px]">Expected Return:</span>
                  <span>{format(new Date(leaveData.expectedReturnDate), "PPP")}</span>
                </div>
              )}
              {leaveData.restDays && (
                <div className="flex">
                  <span className="font-semibold min-w-[140px]">Rest Days:</span>
                  <span>{leaveData.restDays} days</span>
                </div>
              )}
            </div>
          </div>

          {/* Doctor's Remarks */}
          {leaveData.doctorNotes && (
            <div className="mb-6">
              <h4 className="font-semibold text-sm uppercase text-primary border-b pb-2 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Doctor's Remarks
              </h4>
              <p className="text-sm bg-muted/50 p-3 rounded-lg italic">
                "{leaveData.doctorNotes}"
              </p>
            </div>
          )}

          {/* Body Text */}
          <div className="my-6 text-sm text-justify leading-relaxed">
            <p>
              This is to certify that <strong>{leaveData.studentName}</strong> (Roll No: <strong>{leaveData.rollNumber}</strong>), 
              a student of <strong>{leaveData.program}</strong>{leaveData.branch ? ` - ${leaveData.branch}` : ''}, 
              has been referred for medical treatment at <strong>{leaveData.referralHospital}</strong> and 
              is hereby granted medical leave from academic activities.
            </p>
            <p className="mt-3">
              The student is advised to take complete rest and follow the prescribed treatment. 
              {leaveData.restDays && ` A rest period of ${leaveData.restDays} days has been recommended.`}
            </p>
            <p className="mt-3">
              Kindly grant the necessary leave and academic relaxations as per institute norms.
            </p>
          </div>

          {/* Signature Section */}
          <div className="flex justify-between mt-12 pt-6">
            <div className="text-center min-w-[180px]">
              <div className="border-2 border-dashed border-muted-foreground/30 w-24 h-24 mx-auto flex items-center justify-center text-xs text-muted-foreground">
                Official Seal
              </div>
            </div>
            <div className="text-center min-w-[200px]">
              <div className="border-t border-foreground mt-16 pt-2">
                <p className="font-semibold">{leaveData.doctorName || "Medical Officer"}</p>
                <p className="text-sm text-muted-foreground">Health Centre, NIT Warangal</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-4 border-t text-xs text-muted-foreground text-center">
            <p>This is a computer-generated document. For verification, contact Health Centre.</p>
            <p className="mt-1">
              Generated on: {currentDate} | Document ID: {leaveData.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrintableLeaveLetter;
