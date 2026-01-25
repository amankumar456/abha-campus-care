import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface HospitalInfo {
  name: string;
  location: string;
  entitlement?: string;
  phone?: string;
  emergency?: string;
  address?: string;
  directions?: string;
  mapUrl?: string;
  specialties?: string[];
}

interface StudentEmergencyContacts {
  emergencyContact?: string;
  emergencyRelationship?: string;
  fatherName?: string;
  fatherContact?: string;
  motherName?: string;
  motherContact?: string;
  mentorName?: string;
  mentorContact?: string;
  personalPhone?: string;
}

interface PrintableHospitalCardProps {
  hospital: HospitalInfo;
  studentName?: string;
  studentRollNumber?: string;
  studentProgram?: string;
  studentBranch?: string;
  referralDate?: string;
  emergencyContacts?: StudentEmergencyContacts;
}

const PrintableHospitalCard = ({ 
  hospital, 
  studentName, 
  studentRollNumber,
  studentProgram,
  studentBranch,
  referralDate,
  emergencyContacts
}: PrintableHospitalCardProps) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the hospital card');
      return;
    }

    const currentDate = referralDate || new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hospital Referral Card - ${hospital.name}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            background: #fff;
            color: #1a1a1a;
          }
          .card {
            max-width: 450px;
            margin: 0 auto;
            border: 2px solid #1a365d;
            border-radius: 12px;
            overflow: hidden;
            page-break-inside: avoid;
          }
          .header {
            background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
            color: white;
            padding: 16px;
            text-align: center;
          }
          .header h1 {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .header h2 {
            font-size: 11px;
            font-weight: 400;
            opacity: 0.9;
          }
          .hospital-name {
            background: #edf2f7;
            padding: 12px 16px;
            border-bottom: 1px solid #e2e8f0;
          }
          .hospital-name h3 {
            font-size: 16px;
            font-weight: 700;
            color: #1a365d;
            margin-bottom: 4px;
          }
          .hospital-name p {
            font-size: 12px;
            color: #4a5568;
          }
          .content {
            padding: 16px;
          }
          .info-row {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px dashed #e2e8f0;
          }
          .info-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
          }
          .info-row .label {
            font-size: 10px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .info-row .value {
            font-size: 13px;
            color: #1a1a1a;
            line-height: 1.4;
          }
          .emergency {
            background: #fed7d7;
            border: 1px solid #fc8181;
            border-radius: 8px;
            padding: 10px 12px;
            margin-top: 12px;
          }
          .emergency .label {
            color: #c53030;
            font-weight: 600;
            font-size: 11px;
          }
          .emergency .value {
            color: #c53030;
            font-weight: 700;
            font-size: 18px;
          }
          .student-info {
            background: #f0fff4;
            border-top: 2px solid #1a365d;
            padding: 12px 16px;
          }
          .student-info h4 {
            font-size: 10px;
            color: #276749;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            font-weight: 700;
          }
          .student-info p {
            font-size: 12px;
            color: #1a1a1a;
            margin-bottom: 3px;
          }
          .student-info p strong {
            color: #1a365d;
          }
          .emergency-contacts {
            background: #fff5f5;
            border-top: 2px solid #c53030;
            padding: 12px 16px;
          }
          .emergency-contacts h4 {
            font-size: 10px;
            color: #c53030;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            font-weight: 700;
          }
          .contact-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .contact-item {
            background: white;
            border: 1px solid #feb2b2;
            border-radius: 6px;
            padding: 8px;
          }
          .contact-item .contact-label {
            font-size: 9px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .contact-item .contact-name {
            font-size: 11px;
            color: #1a365d;
            font-weight: 600;
            margin-bottom: 1px;
          }
          .contact-item .contact-phone {
            font-size: 12px;
            color: #c53030;
            font-weight: 700;
          }
          .primary-contact {
            grid-column: span 2;
            background: #c53030;
            border-color: #c53030;
          }
          .primary-contact .contact-label {
            color: #fed7d7;
          }
          .primary-contact .contact-name {
            color: white;
          }
          .primary-contact .contact-phone {
            color: white;
            font-size: 16px;
          }
          .footer {
            background: #1a365d;
            color: white;
            padding: 10px 16px;
            text-align: center;
            font-size: 10px;
          }
          .specialties {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 4px;
          }
          .specialty-tag {
            background: #e2e8f0;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 10px;
            color: #4a5568;
          }
          @media print {
            body {
              padding: 0;
            }
            .card {
              border: 2px solid #1a365d;
            }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>NIT WARANGAL HEALTH CENTRE</h1>
            <h2>Hospital Referral Card</h2>
          </div>
          
          <div class="hospital-name">
            <h3>🏥 ${hospital.name}</h3>
            <p>📍 ${hospital.location}</p>
          </div>
          
          <div class="content">
            ${hospital.address ? `
              <div class="info-row">
                <div>
                  <div class="label">Full Address</div>
                  <div class="value">${hospital.address}</div>
                </div>
              </div>
            ` : ''}
            
            ${hospital.phone ? `
              <div class="info-row">
                <div>
                  <div class="label">Contact Number</div>
                  <div class="value">📞 ${hospital.phone}</div>
                </div>
              </div>
            ` : ''}
            
            ${hospital.directions ? `
              <div class="info-row">
                <div>
                  <div class="label">Directions from NIT Warangal</div>
                  <div class="value">🧭 ${hospital.directions}</div>
                </div>
              </div>
            ` : ''}

            ${hospital.specialties && hospital.specialties.length > 0 ? `
              <div class="info-row">
                <div>
                  <div class="label">Specialties Available</div>
                  <div class="specialties">
                    ${hospital.specialties.map(s => `<span class="specialty-tag">${s}</span>`).join('')}
                  </div>
                </div>
              </div>
            ` : ''}
            
            ${hospital.emergency ? `
              <div class="emergency">
                <div class="label">🚨 HOSPITAL EMERGENCY HELPLINE</div>
                <div class="value">${hospital.emergency}</div>
              </div>
            ` : ''}
          </div>
          
          ${studentName || studentRollNumber ? `
            <div class="student-info">
              <h4>👤 Student Details</h4>
              ${studentName ? `<p><strong>Name:</strong> ${studentName}</p>` : ''}
              ${studentRollNumber ? `<p><strong>Roll No:</strong> ${studentRollNumber}</p>` : ''}
              ${studentProgram ? `<p><strong>Program:</strong> ${studentProgram}</p>` : ''}
              ${studentBranch ? `<p><strong>Branch:</strong> ${studentBranch}</p>` : ''}
              ${emergencyContacts?.personalPhone ? `<p><strong>Student Phone:</strong> ${emergencyContacts.personalPhone}</p>` : ''}
              <p><strong>Referral Date:</strong> ${currentDate}</p>
            </div>
          ` : `
            <div class="student-info">
              <h4>Referral Date</h4>
              <p>${currentDate}</p>
            </div>
          `}
          
          ${emergencyContacts ? `
            <div class="emergency-contacts">
              <h4>🆘 Emergency Contacts</h4>
              <div class="contact-grid">
                ${emergencyContacts.emergencyContact ? `
                  <div class="contact-item primary-contact">
                    <div class="contact-label">Primary Emergency Contact${emergencyContacts.emergencyRelationship ? ` (${emergencyContacts.emergencyRelationship})` : ''}</div>
                    <div class="contact-phone">📞 ${emergencyContacts.emergencyContact}</div>
                  </div>
                ` : ''}
                
                ${emergencyContacts.fatherName || emergencyContacts.fatherContact ? `
                  <div class="contact-item">
                    <div class="contact-label">Father</div>
                    ${emergencyContacts.fatherName ? `<div class="contact-name">${emergencyContacts.fatherName}</div>` : ''}
                    ${emergencyContacts.fatherContact ? `<div class="contact-phone">📞 ${emergencyContacts.fatherContact}</div>` : ''}
                  </div>
                ` : ''}
                
                ${emergencyContacts.motherName || emergencyContacts.motherContact ? `
                  <div class="contact-item">
                    <div class="contact-label">Mother</div>
                    ${emergencyContacts.motherName ? `<div class="contact-name">${emergencyContacts.motherName}</div>` : ''}
                    ${emergencyContacts.motherContact ? `<div class="contact-phone">📞 ${emergencyContacts.motherContact}</div>` : ''}
                  </div>
                ` : ''}
                
                ${emergencyContacts.mentorName || emergencyContacts.mentorContact ? `
                  <div class="contact-item">
                    <div class="contact-label">Faculty Mentor</div>
                    ${emergencyContacts.mentorName ? `<div class="contact-name">${emergencyContacts.mentorName}</div>` : ''}
                    ${emergencyContacts.mentorContact ? `<div class="contact-phone">📞 ${emergencyContacts.mentorContact}</div>` : ''}
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          <div class="footer">
            This card is issued by NIT Warangal Health Centre for off-campus medical treatment.
            <br/>For verification, contact: 0870-2462099
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className="gap-2"
    >
      <Printer className="h-4 w-4" />
      Print Hospital Card
    </Button>
  );
};

export default PrintableHospitalCard;
