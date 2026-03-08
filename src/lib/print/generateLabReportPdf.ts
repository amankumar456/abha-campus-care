import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface LabReportParam {
  name: string;
  value: string;
  unit: string;
  refRange: string;
  flag: string;
}

interface LabReportPdfOptions {
  reportId: string;
  testName: string;
  studentName: string;
  rollNumber: string;
  program: string;
  branch: string;
  doctorName: string;
  testDate: string;
  parameters: LabReportParam[];
  techNotes: string;
  sampleOk: boolean;
}

export function generateLabReportPdf(opts: LabReportPdfOptions): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const reportNo = `LR/${format(new Date(opts.testDate), "yyyyMMdd")}/${opts.reportId.slice(0, 6).toUpperCase()}`;

  // Header
  doc.setFillColor(30, 58, 138); // #1e3a8a
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("NATIONAL INSTITUTE OF TECHNOLOGY, WARANGAL", pageWidth / 2, 10, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Health Centre — Laboratory Division", pageWidth / 2, 16, { align: "center" });
  doc.text("Warangal, Telangana — 506004 | Phone: 0870-2462071", pageWidth / 2, 21, { align: "center" });

  // Title
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("LABORATORY INVESTIGATION REPORT", pageWidth / 2, 36, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Report No.: ${reportNo}`, pageWidth / 2, 42, { align: "center" });

  // Patient Details Box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 47, pageWidth - 28, 30, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setTextColor(30, 58, 138);
  doc.setFont("helvetica", "bold");
  doc.text("PATIENT DETAILS", 18, 53);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(8.5);

  const col1X = 18;
  const col2X = pageWidth / 2 + 5;
  doc.text(`Patient Name:  ${opts.studentName}`, col1X, 60);
  doc.text(`Roll Number:  ${opts.rollNumber}`, col2X, 60);
  doc.text(`Programme:  ${opts.program}`, col1X, 66);
  doc.text(`Branch:  ${opts.branch || "N/A"}`, col2X, 66);
  doc.text(`Referring Doctor:  Dr. ${opts.doctorName}`, col1X, 72);
  doc.text(`Test Date:  ${format(new Date(opts.testDate), "dd MMM yyyy")}`, col2X, 72);

  // Test Name
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.setFont("helvetica", "bold");
  doc.text(`TEST: ${opts.testName.toUpperCase()}`, 14, 86);

  // Results Table
  if (opts.parameters.length > 0) {
    const tableData = opts.parameters.map(p => [
      p.name,
      p.value || "—",
      p.unit,
      p.refRange,
      p.flag === "high" ? "↑ HIGH" : p.flag === "low" ? "↓ LOW" : p.flag === "normal" ? "✓ Normal" : "—",
    ]);

    autoTable(doc, {
      startY: 90,
      head: [["Parameter", "Result", "Unit", "Reference Range", "Flag"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50],
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30, fontStyle: "bold" },
        4: { cellWidth: 25 },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 4) {
          const text = data.cell.text.join("");
          if (text.includes("HIGH") || text.includes("LOW")) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = "bold";
          } else if (text.includes("Normal")) {
            data.cell.styles.textColor = [22, 163, 74];
          }
        }
      },
      margin: { left: 14, right: 14 },
    });
  }

  // Technician Notes
  const finalY = (doc as any).lastAutoTable?.finalY || 92;
  if (opts.techNotes) {
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text("Technician Notes:", 14, finalY + 10);
    doc.setFont("helvetica", "normal");
    doc.text(opts.techNotes, 14, finalY + 16, { maxWidth: pageWidth - 28 });
  }

  const sigY = finalY + (opts.techNotes ? 32 : 20);

  // Sample quality
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`Sample Quality: ${opts.sampleOk ? "Satisfactory" : "Issue Noted"}`, 14, sigY);

  // Signature Section
  const signatureY = sigY + 12;
  doc.setDrawColor(150, 150, 150);
  doc.line(14, signatureY, 80, signatureY);
  doc.line(pageWidth - 80, signatureY, pageWidth - 14, signatureY);

  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "bold");
  doc.text("Lab Technician", 14, signatureY + 5);
  doc.text("Pathologist", pageWidth - 80, signatureY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("NIT Warangal Health Centre", 14, signatureY + 10);
  doc.text("NIT Warangal Health Centre", pageWidth - 80, signatureY + 10);

  // Footer
  doc.setFontSize(6.5);
  doc.setTextColor(150, 150, 150);
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.text(`Generated on ${format(new Date(), "dd MMM yyyy, hh:mm a")} | Report No.: ${reportNo}`, pageWidth / 2, footerY, { align: "center" });
  doc.text("This is a computer-generated report from NIT Warangal Health Centre Laboratory", pageWidth / 2, footerY + 4, { align: "center" });

  return doc.output("blob");
}
