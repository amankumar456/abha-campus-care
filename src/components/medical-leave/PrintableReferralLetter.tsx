import { Button } from "@/components/ui/button";
import { Printer, FileText } from "lucide-react";
import { format } from "date-fns";

interface HospitalInfo {
  name: string;
  location: string;
  phone?: string;
  emergency?: string;
  address?: string;
  directions?: string;
  specialties?: string[];
}

interface DoctorDetails {
  name: string;
  designation?: string;
  qualification?: string;
  isSenior?: boolean;
}

interface MentorDetails {
  name?: string;
  department?: string;
  phone?: string;
  email?: string;
}

interface AcademicDetails {
  hodName?: string;
  hodDepartment?: string;
  semester?: string;
  yearOfStudy?: string;
}

interface ReferralLetterData {
  studentName: string;
  rollNumber: string;
  program?: string;
  branch?: string | null;
  hospital: HospitalInfo;
  illnessDescription: string;
  leaveDays: number;
  healthPriority: string;
  doctorNotes?: string;
  doctorName?: string;
  doctorDetails?: DoctorDetails | null;
  mentorDetails?: MentorDetails | null;
  academicDetails?: AcademicDetails | null;
}

interface PrintableReferralLetterProps {
  data: ReferralLetterData;
}

const PrintableReferralLetter = ({ data }: PrintableReferralLetterProps) => {
  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const currentDate = format(new Date(), "PPP");
    const expectedReturnDate = format(
      new Date(Date.now() + data.leaveDays * 24 * 60 * 60 * 1000),
      "PPP"
    );

    const priorityColors: Record<string, { bg: string; text: string; label: string }> = {
      low: { bg: "#dcfce7", text: "#166534", label: "Low Priority" },
      medium: { bg: "#fef3c7", text: "#92400e", label: "Medium Priority" },
      high: { bg: "#fee2e2", text: "#991b1b", label: "High Priority / Urgent" },
    };

    const priority = priorityColors[data.healthPriority] || priorityColors.medium;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medical Referral Letter - ${data.studentName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Times New Roman', serif;
              padding: 40px;
              line-height: 1.6;
              color: #1a1a1a;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 25px;
              border-bottom: 3px double #003366;
              padding-bottom: 20px;
            }
            .header h1 {
              font-size: 22px;
              color: #003366;
              margin-bottom: 5px;
              letter-spacing: 1px;
            }
            .header h2 {
              font-size: 16px;
              color: #0066cc;
              font-weight: normal;
            }
            .header p {
              font-size: 11px;
              color: #666;
              margin-top: 5px;
            }
            .title {
              text-align: center;
              margin: 20px 0;
            }
            .title h3 {
              font-size: 18px;
              text-decoration: underline;
              color: #003366;
              letter-spacing: 0.5px;
            }
            .priority-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              margin-top: 10px;
              background: ${priority.bg};
              color: ${priority.text};
            }
            .ref-date {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              font-size: 12px;
              color: #333;
            }
            .section {
              margin-bottom: 18px;
              page-break-inside: avoid;
            }
            .section-title {
              font-weight: bold;
              color: #003366;
              margin-bottom: 8px;
              font-size: 13px;
              text-transform: uppercase;
              border-bottom: 1px solid #ddd;
              padding-bottom: 4px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
            }
            .info-item {
              display: flex;
              font-size: 12px;
            }
            .info-label {
              font-weight: bold;
              min-width: 130px;
              color: #333;
            }
            .full-width { grid-column: 1 / -1; }
            .hospital-box {
              background: #f0f7ff;
              border: 1px solid #cce0ff;
              border-radius: 6px;
              padding: 12px;
              margin-top: 8px;
            }
            .hospital-name {
              font-weight: bold;
              font-size: 14px;
              color: #003366;
              margin-bottom: 8px;
            }
            .hospital-detail {
              font-size: 11px;
              color: #444;
              margin: 4px 0;
            }
            .emergency-number {
              color: #c53030;
              font-weight: bold;
            }
            .body-text {
              text-align: justify;
              margin: 18px 0;
              font-size: 13px;
              line-height: 1.7;
            }
            .body-text p { margin-bottom: 10px; }
            .notes-box {
              background: #fffbeb;
              border-left: 4px solid #f59e0b;
              padding: 10px 14px;
              margin: 15px 0;
              font-size: 12px;
              font-style: italic;
            }
            .directions-box {
              background: #ecfdf5;
              border: 1px solid #a7f3d0;
              border-radius: 6px;
              padding: 10px;
              margin-top: 8px;
              font-size: 11px;
            }
            .directions-title {
              font-weight: bold;
              color: #065f46;
              margin-bottom: 5px;
            }
            .signature-section {
              margin-top: 35px;
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 15px;
            }
            .signature-box {
              text-align: center;
              min-width: 140px;
            }
            .signature-line {
              border-top: 1px solid #333;
              margin-top: 35px;
              padding-top: 6px;
              font-size: 11px;
            }
            .online-signature {
              font-family: 'Brush Script MT', 'Segoe Script', cursive;
              font-size: 20px;
              color: #003366;
              height: 35px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .doctor-type {
              font-size: 10px;
              color: #666;
              margin-top: 2px;
            }
            .stamp-area {
              border: 3px double #003366;
              width: 90px;
              height: 90px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              margin: 0 auto;
              border-radius: 50%;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            }
            .stamp-text {
              font-size: 8px;
              color: #003366;
              font-weight: bold;
              text-align: center;
            }
            .stamp-title {
              font-size: 10px;
              color: #003366;
              font-weight: bold;
              margin: 2px 0;
            }
            .mentor-section {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 12px;
              margin: 15px 0;
            }
            .mentor-title {
              font-weight: bold;
              color: #0369a1;
              font-size: 12px;
              margin-bottom: 8px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 4px;
            }
            .footer {
              margin-top: 25px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
              font-size: 10px;
              color: #666;
              text-align: center;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NATIONAL INSTITUTE OF TECHNOLOGY WARANGAL</h1>
            <h2>Health Centre - Medical Referral</h2>
            <p>Warangal, Telangana - 506004 | Phone: 0870-2462099 | health.centre@nitw.ac.in</p>
          </div>

          <div class="title">
            <h3>MEDICAL REFERRAL LETTER</h3>
            <div class="priority-badge">${priority.label}</div>
          </div>

          <div class="ref-date">
            <div><strong>Ref No:</strong> NITW/HC/REF/${Date.now().toString(36).toUpperCase()}</div>
            <div><strong>Date:</strong> ${currentDate}</div>
          </div>

          <div class="section">
            <div class="section-title">Student Information</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Name:</span>
                <span>${data.studentName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Roll Number:</span>
                <span>${data.rollNumber}</span>
              </div>
              ${data.program ? `
              <div class="info-item">
                <span class="info-label">Program:</span>
                <span>${data.program}</span>
              </div>
              ` : ''}
              ${data.branch ? `
              <div class="info-item">
                <span class="info-label">Branch:</span>
                <span>${data.branch}</span>
              </div>
              ` : ''}
            </div>
          </div>

          ${(data.mentorDetails || data.academicDetails) ? `
          <div class="mentor-section">
            <div class="mentor-title">Academic & Mentorship Details</div>
            <div class="info-grid">
              ${data.mentorDetails?.name ? `
              <div class="info-item">
                <span class="info-label">Mentor Name:</span>
                <span>${data.mentorDetails.name}</span>
              </div>
              ` : ''}
              ${data.mentorDetails?.department ? `
              <div class="info-item">
                <span class="info-label">Department:</span>
                <span>${data.mentorDetails.department}</span>
              </div>
              ` : ''}
              ${data.mentorDetails?.phone ? `
              <div class="info-item">
                <span class="info-label">Mentor Contact:</span>
                <span>${data.mentorDetails.phone}</span>
              </div>
              ` : ''}
              ${data.academicDetails?.hodName ? `
              <div class="info-item">
                <span class="info-label">HOD:</span>
                <span>${data.academicDetails.hodName}</span>
              </div>
              ` : ''}
              ${data.academicDetails?.yearOfStudy ? `
              <div class="info-item">
                <span class="info-label">Year of Study:</span>
                <span>${data.academicDetails.yearOfStudy}</span>
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Medical Details</div>
            <div class="info-grid">
              <div class="info-item full-width">
                <span class="info-label">Illness/Condition:</span>
                <span>${data.illnessDescription}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Leave Duration:</span>
                <span><strong>${data.leaveDays} days</strong></span>
              </div>
              <div class="info-item">
                <span class="info-label">Expected Return:</span>
                <span>${expectedReturnDate}</span>
              </div>
              ${data.doctorDetails?.designation ? `
              <div class="info-item">
                <span class="info-label">Referring Doctor:</span>
                <span>${data.doctorDetails.name || data.doctorName || "Medical Officer"} (${data.doctorDetails.designation})</span>
              </div>
              ` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Referred Hospital</div>
            <div class="hospital-box">
              <div class="hospital-name">${data.hospital.name}</div>
              ${data.hospital.address ? `<div class="hospital-detail"><strong>Address:</strong> ${data.hospital.address}</div>` : ''}
              <div class="hospital-detail">
                ${data.hospital.phone ? `<strong>Phone:</strong> ${data.hospital.phone}` : ''}
                ${data.hospital.emergency ? ` | <span class="emergency-number"><strong>Emergency:</strong> ${data.hospital.emergency}</span>` : ''}
              </div>
              ${data.hospital.specialties?.length ? `<div class="hospital-detail"><strong>Specialties:</strong> ${data.hospital.specialties.join(', ')}</div>` : ''}
            </div>
            ${data.hospital.directions ? `
            <div class="directions-box">
              <div class="directions-title">📍 Directions from NIT Warangal:</div>
              ${data.hospital.directions}
            </div>
            ` : ''}
          </div>

          ${data.doctorNotes ? `
          <div class="notes-box">
            <strong>Doctor's Notes:</strong> ${data.doctorNotes}
          </div>
          ` : ''}

          <div class="body-text">
            <p>To Whom It May Concern,</p>
            <p>
              This is to certify that <strong>${data.studentName}</strong> (Roll No: <strong>${data.rollNumber}</strong>), 
              a student of NIT Warangal, is being referred to <strong>${data.hospital.name}</strong> 
              for treatment of <strong>${data.illnessDescription}</strong>.
            </p>
            <p>
              The student is granted medical leave for <strong>${data.leaveDays} days</strong> starting from 
              <strong>${currentDate}</strong>. The expected date of return is <strong>${expectedReturnDate}</strong>.
            </p>
            <p>
              Kindly provide the necessary medical attention and treatment. The student is advised to report 
              back to the Health Centre upon return to campus.
            </p>
          </div>

          <div class="signature-section">
            <!-- CMO Seal -->
            <div class="signature-box">
              <div class="stamp-area">
                <span class="stamp-text">CHIEF MEDICAL</span>
                <span class="stamp-title">OFFICER</span>
                <span class="stamp-text">NIT WARANGAL</span>
              </div>
              <p style="font-size: 9px; color: #666; margin-top: 5px;">Official Seal</p>
            </div>
            
            <!-- Doctor Signature -->
            <div class="signature-box">
              <div class="online-signature">${data.doctorDetails?.name || data.doctorName || "Medical Officer"}</div>
              <div class="signature-line">
                <strong>${data.doctorDetails?.name || data.doctorName || "Medical Officer"}</strong><br/>
                ${data.doctorDetails?.designation || "Medical Officer"}<br/>
                ${data.doctorDetails?.qualification ? `<span style="font-size: 10px;">${data.doctorDetails.qualification}</span><br/>` : ''}
                <span class="doctor-type">${data.doctorDetails?.isSenior ? "Senior Medical Officer" : "Medical Officer"}</span>
              </div>
            </div>
            
            <!-- Dean Signature -->
            <div class="signature-box">
              <div class="signature-line">
                <strong>Dean (Student Welfare)</strong><br/>
                NIT Warangal<br/>
                <span style="font-size: 9px; color: #666;">(For leaves > 7 days)</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>This is a digitally generated medical referral document with electronic signature from NIT Warangal Health Centre.</p>
            <p>For verification, contact: health.centre@nitw.ac.in | 0870-2462099</p>
            <p>Generated: ${currentDate}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className="flex items-center gap-2"
    >
      <FileText className="h-4 w-4" />
      Print Referral Letter
    </Button>
  );
};

export default PrintableReferralLetter;
