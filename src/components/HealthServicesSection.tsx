import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Calendar, 
  FileHeart, 
  Stethoscope, 
  ClipboardList, 
  UserCheck,
  FileText,
  ArrowRight,
  Clock,
  User,
  CheckCircle,
  Download,
  Eye,
  Printer,
  Activity,
  Shield,
  Syringe,
  Heart,
  Brain
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Enhanced Health Records with detailed clinical data
const DUMMY_HEALTH_RECORDS = [
  { 
    id: 1, 
    title: "Annual Health Checkup 2025", 
    date: "Dec 15, 2025", 
    type: "Report",
    size: "2.4 MB",
    doctor: "Dr. Rajesh Kumar",
    department: "General Medicine",
    studentName: "Rahul Sharma",
    rollNumber: "CS21B1045",
    summary: "Complete annual health screening with all parameters within normal range.",
    details: "Blood Pressure: 120/80 mmHg\nPulse Rate: 72 bpm\nBMI: 22.5 (Normal)\nVision: 6/6 both eyes\nHearing: Normal\nDental: Good oral hygiene",
    recommendations: "Continue healthy lifestyle. Next checkup due in 12 months."
  },
  { 
    id: 2, 
    title: "Complete Blood Count (CBC)", 
    date: "Jan 05, 2026", 
    type: "Lab Report",
    size: "1.1 MB",
    doctor: "Dr. Anil Reddy",
    department: "Pathology",
    studentName: "Rahul Sharma",
    rollNumber: "CS21B1045",
    summary: "Routine blood test showing normal hematological parameters.",
    details: "Hemoglobin: 14.2 g/dL (Normal: 13-17)\nWBC: 7,500/μL (Normal: 4,500-11,000)\nRBC: 4.8 million/μL (Normal: 4.5-5.5)\nPlatelet Count: 250,000/μL (Normal: 150,000-400,000)\nHematocrit: 42% (Normal: 38-50%)",
    recommendations: "All values within normal range. No follow-up required."
  },
  { 
    id: 3, 
    title: "Chest X-Ray Report", 
    date: "Nov 20, 2025", 
    type: "Radiology",
    size: "5.2 MB",
    doctor: "Dr. Priya Sharma",
    department: "Radiology",
    studentName: "Rahul Sharma",
    rollNumber: "CS21B1045",
    summary: "PA view chest X-ray showing clear lung fields.",
    details: "Lungs: Clear, no infiltrates or consolidation\nHeart: Normal size and shape\nMediastinum: Normal\nBony thorax: Intact\nDiaphragm: Normal position and contour",
    recommendations: "No abnormality detected. Routine annual X-ray recommended."
  },
  { 
    id: 4, 
    title: "Prescription - Viral Fever", 
    date: "Jan 10, 2026", 
    type: "Prescription",
    size: "0.5 MB",
    doctor: "Dr. Rajesh Kumar",
    department: "General Medicine",
    studentName: "Rahul Sharma",
    rollNumber: "CS21B1045",
    summary: "Treatment for viral fever with supportive care.",
    details: "1. Paracetamol 500mg - 1 tablet TDS for 3 days\n2. Cetirizine 10mg - 1 tablet OD at night for 5 days\n3. Vitamin C 500mg - 1 tablet OD for 7 days\n4. ORS - as needed for hydration",
    recommendations: "Rest for 2-3 days. Drink plenty of fluids. Return if fever persists beyond 5 days."
  },
  { 
    id: 5, 
    title: "Liver Function Test (LFT)", 
    date: "Dec 28, 2025", 
    type: "Lab Report",
    size: "0.8 MB",
    doctor: "Dr. Sanjay Gupta",
    department: "Pathology",
    studentName: "Rahul Sharma",
    rollNumber: "CS21B1045",
    summary: "Comprehensive liver function panel with normal results.",
    details: "Total Bilirubin: 0.8 mg/dL (Normal: 0.3-1.2)\nDirect Bilirubin: 0.2 mg/dL (Normal: 0-0.3)\nSGOT (AST): 28 U/L (Normal: 8-40)\nSGPT (ALT): 32 U/L (Normal: 7-56)\nAlkaline Phosphatase: 78 U/L (Normal: 44-147)\nTotal Protein: 7.2 g/dL (Normal: 6-8.3)",
    recommendations: "Liver function is normal. Maintain healthy diet and lifestyle."
  },
  { 
    id: 6, 
    title: "Eye Examination Report", 
    date: "Jan 08, 2026", 
    type: "Checkup",
    size: "0.6 MB",
    doctor: "Dr. Kavitha Rao",
    department: "Ophthalmology",
    studentName: "Rahul Sharma",
    rollNumber: "CS21B1045",
    summary: "Comprehensive eye examination with normal findings.",
    details: "Visual Acuity: 6/6 (Right), 6/6 (Left)\nNear Vision: N6 both eyes\nColor Vision: Normal (Ishihara test)\nIntraocular Pressure: 14 mmHg (Right), 15 mmHg (Left)\nFundus Examination: Normal optic disc and macula",
    recommendations: "No refractive error. Regular eye checkup every 2 years recommended."
  }
];

// Enhanced Medical Certificates with full details
const DUMMY_CERTIFICATES = [
  { 
    id: 1, 
    title: "Medical Leave Certificate", 
    date: "Jan 12, 2026", 
    doctor: "Dr. Rajesh Kumar",
    department: "General Medicine",
    duration: "3 days",
    status: "approved",
    studentName: "Rahul Sharma",
    rollNumber: "CS21B1045",
    validFrom: "Jan 12, 2026",
    validTo: "Jan 14, 2026",
    diagnosis: "Acute viral fever with body ache",
    certNo: "MLC/2026/0142",
    remarks: "Complete bed rest advised. Student is unfit for attending classes during the mentioned period."
  },
  { 
    id: 2, 
    title: "Fitness Certificate - Sports", 
    date: "Jan 05, 2026", 
    doctor: "Dr. Priya Sharma",
    department: "Sports Medicine",
    duration: "1 year",
    status: "approved",
    studentName: "Rahul Sharma",
    rollNumber: "CS21B1045",
    validFrom: "Jan 05, 2026",
    validTo: "Jan 04, 2027",
    diagnosis: "Physically fit for all sports activities",
    certNo: "FC/SP/2026/0089",
    remarks: "Student has been examined and found medically fit to participate in inter-college sports events including athletics, football, and basketball."
  },
  { 
    id: 3, 
    title: "Medical Leave Certificate", 
    date: "Dec 10, 2025", 
    doctor: "Dr. Anil Reddy",
    department: "General Medicine",
    duration: "2 days",
    status: "approved",
    studentName: "Rahul Sharma",
    rollNumber: "CS21B1045",
    validFrom: "Dec 10, 2025",
    validTo: "Dec 11, 2025",
    diagnosis: "Acute gastroenteritis",
    certNo: "MLC/2025/1856",
    remarks: "Student suffered from food poisoning symptoms. Rest and bland diet advised."
  },
  { 
    id: 4, 
    title: "Fitness Certificate - NSS", 
    date: "Nov 28, 2025", 
    doctor: "Dr. Kavitha Rao",
    department: "General Medicine",
    duration: "6 months",
    status: "approved",
    studentName: "Rahul Sharma",
    rollNumber: "CS21B1045",
    validFrom: "Nov 28, 2025",
    validTo: "May 27, 2026",
    diagnosis: "Fit for NSS camp activities",
    certNo: "FC/NSS/2025/0234",
    remarks: "Student is medically fit to participate in NSS rural camp activities including moderate physical labor and community service."
  },
  { 
    id: 5, 
    title: "Vaccination Certificate - COVID-19", 
    date: "Oct 15, 2025", 
    doctor: "Dr. Meera Krishnan",
    department: "Immunization",
    duration: "Permanent",
    status: "approved",
    studentName: "Rahul Sharma",
    rollNumber: "CS21B1045",
    validFrom: "Oct 15, 2025",
    validTo: "N/A",
    diagnosis: "COVID-19 Booster Dose Administered",
    certNo: "VAC/COV/2025/4521",
    remarks: "Covaxin booster dose administered. Primary vaccination series completed on Apr 2021. No adverse reactions observed post-vaccination."
  },
  { 
    id: 6, 
    title: "Mental Wellness Clearance", 
    date: "Jan 18, 2026", 
    doctor: "Dr. Sanjay Gupta",
    department: "Psychiatry",
    duration: "6 months",
    status: "approved",
    studentName: "Rahul Sharma",
    rollNumber: "CS21B1045",
    validFrom: "Jan 18, 2026",
    validTo: "Jul 17, 2026",
    diagnosis: "Stress management counseling completed",
    certNo: "MWC/2026/0067",
    remarks: "Student has completed 4 counseling sessions for academic stress management. Shows good coping mechanisms and positive outlook."
  }
];

// Dummy Appointments Data
const DUMMY_APPOINTMENTS = [
  { id: 1, doctor: "Dr. Rajesh Kumar", specialty: "General Medicine", date: "Jan 20, 2026", time: "10:00 AM", status: "confirmed" },
  { id: 2, doctor: "Dr. Suresh Menon", specialty: "Orthopaedics", date: "Jan 22, 2026", time: "11:30 AM", status: "pending" },
  { id: 3, doctor: "Dr. Priya Sharma", specialty: "General Surgery", date: "Jan 25, 2026", time: "02:00 PM", status: "confirmed" },
  { id: 4, doctor: "Dr. Meera Krishnan", specialty: "Gynaecology", date: "Jan 27, 2026", time: "09:30 AM", status: "pending" },
];

// Enhanced Visits Data
const DUMMY_VISITS = [
  { id: 1, date: "Jan 15, 2026", doctor: "Dr. Rajesh Kumar", reason: "Fever & Cold", diagnosis: "Viral Infection", followUp: true, prescription: "Paracetamol, Cetirizine, Vitamin C" },
  { id: 2, date: "Jan 08, 2026", doctor: "Dr. Anil Reddy", reason: "Routine Checkup", diagnosis: "Healthy", followUp: false, prescription: "Multivitamin supplement" },
  { id: 3, date: "Dec 20, 2025", doctor: "Dr. Sanjay Gupta", reason: "Stress & Anxiety", diagnosis: "Mild Anxiety", followUp: true, prescription: "Counseling recommended" },
  { id: 4, date: "Nov 15, 2025", doctor: "Dr. Kavitha Rao", reason: "Stomach Pain", diagnosis: "Gastritis", followUp: false, prescription: "Antacid, dietary modifications" },
];

// Enhanced Health Checkups
const DUMMY_CHECKUPS = [
  { id: 1, name: "Annual Health Screening", date: "Feb 15, 2026", status: "scheduled", tests: ["Blood Test", "ECG", "Eye Test", "Dental Check"], venue: "Health Centre, Main Campus" },
  { id: 2, name: "Vaccination Drive - Flu Shot", date: "Feb 01, 2026", status: "upcoming", tests: ["Influenza Vaccine"], venue: "Health Centre, Room 102" },
  { id: 3, name: "Mental Wellness Assessment", date: "Mar 10, 2026", status: "upcoming", tests: ["Counseling Session", "Stress Assessment"], venue: "Counseling Centre" },
  { id: 4, name: "Dental Checkup Camp", date: "Feb 20, 2026", status: "upcoming", tests: ["Dental Examination", "Cleaning"], venue: "Health Centre, Dental Wing" },
];

// Digital Health Records Summary
const DUMMY_DIGITAL_RECORDS = [
  { id: 1, category: "Prescriptions", count: 12, lastUpdated: "Jan 15, 2026", icon: FileText },
  { id: 2, category: "Lab Reports", count: 8, lastUpdated: "Jan 10, 2026", icon: Activity },
  { id: 3, category: "Radiology", count: 3, lastUpdated: "Nov 20, 2025", icon: FileHeart },
  { id: 4, category: "Vaccination Records", count: 5, lastUpdated: "Dec 01, 2025", icon: Syringe },
  { id: 5, category: "Checkup Reports", count: 4, lastUpdated: "Oct 15, 2025", icon: Heart },
  { id: 6, category: "Medical Certificates", count: 6, lastUpdated: "Jan 12, 2026", icon: ClipboardList },
];

const getRecordTypeColor = (type: string) => {
  switch (type) {
    case "Report": return "bg-blue-100 text-blue-700";
    case "Lab Report": return "bg-purple-100 text-purple-700";
    case "Radiology": return "bg-rose-100 text-rose-700";
    case "Prescription": return "bg-green-100 text-green-700";
    case "Checkup": return "bg-amber-100 text-amber-700";
    default: return "bg-muted text-muted-foreground";
  }
};

const getRecordIcon = (type: string) => {
  switch (type) {
    case "Report": return Heart;
    case "Lab Report": return Activity;
    case "Radiology": return FileHeart;
    case "Prescription": return FileText;
    case "Checkup": return UserCheck;
    default: return FileText;
  }
};

const ServiceCard = ({ 
  icon: Icon, 
  title, 
  description, 
  color, 
  children,
  href 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  color: string;
  children?: React.ReactNode;
  href?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (href) {
    return (
      <Link to={href}>
        <Card className="h-full hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" className="w-full justify-between group-hover:bg-primary/5">
              View Details
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="h-full hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" className="w-full justify-between group-hover:bg-primary/5">
              View Details
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
              <Icon className="h-5 w-5" />
            </div>
            {title}
          </DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

// Record Detail Dialog Component
const RecordDetailDialog = ({ record, children }: { record: typeof DUMMY_HEALTH_RECORDS[0], children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const RecordIcon = getRecordIcon(record.type);

  const handleDownload = () => {
    const content = `
═══════════════════════════════════════════════════════════════
                    NIT WARANGAL HEALTH CENTRE
                       MEDICAL DOCUMENT
═══════════════════════════════════════════════════════════════

Document Title: ${record.title}
Document Type: ${record.type}
Date: ${record.date}

───────────────────────────────────────────────────────────────
                      PATIENT INFORMATION
───────────────────────────────────────────────────────────────
Patient Name: ${record.studentName}
Roll Number: ${record.rollNumber}
Department: Computer Science & Engineering

───────────────────────────────────────────────────────────────
                      DOCTOR INFORMATION
───────────────────────────────────────────────────────────────
Attending Physician: ${record.doctor}
Department: ${record.department}

───────────────────────────────────────────────────────────────
                      CLINICAL SUMMARY
───────────────────────────────────────────────────────────────
${record.summary}

───────────────────────────────────────────────────────────────
                      DETAILED FINDINGS
───────────────────────────────────────────────────────────────
${record.details}

───────────────────────────────────────────────────────────────
                      RECOMMENDATIONS
───────────────────────────────────────────────────────────────
${record.recommendations}

═══════════════════════════════════════════════════════════════
This is a computer-generated document from NIT Warangal Health 
Centre Management System.
Generated on: ${new Date().toLocaleString()}
═══════════════════════════════════════════════════════════════
    `.trim();
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.title.replace(/\s+/g, '_')}_${record.date.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Document downloaded successfully");
  };

  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${getRecordTypeColor(record.type)} flex items-center justify-center`}>
              <RecordIcon className="h-5 w-5" />
            </div>
            {record.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={getRecordTypeColor(record.type)}>{record.type}</Badge>
            <span className="text-sm text-muted-foreground">{record.date}</span>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Patient Name</p>
              <p className="font-medium">{record.studentName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Roll Number</p>
              <p className="font-medium">{record.rollNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Attending Doctor</p>
              <p className="font-medium">{record.doctor}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department</p>
              <p className="font-medium">{record.department}</p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-semibold mb-2">Clinical Summary</h4>
            <p className="text-muted-foreground">{record.summary}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Detailed Findings</h4>
            <div className="bg-muted/50 p-3 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm font-mono">{record.details}</pre>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Recommendations</h4>
            <p className="text-muted-foreground">{record.recommendations}</p>
          </div>
          
          <Separator />
          
          <div className="flex gap-2">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={handlePrint} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Certificate Detail Dialog Component
const CertificateDetailDialog = ({ cert, children }: { cert: typeof DUMMY_CERTIFICATES[0], children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownload = () => {
    const content = `
═══════════════════════════════════════════════════════════════
                    NIT WARANGAL HEALTH CENTRE
                      MEDICAL CERTIFICATE
═══════════════════════════════════════════════════════════════

Certificate No: ${cert.certNo}
Certificate Type: ${cert.title}
Issue Date: ${cert.date}

───────────────────────────────────────────────────────────────
                      STUDENT INFORMATION
───────────────────────────────────────────────────────────────
Name: ${cert.studentName}
Roll Number: ${cert.rollNumber}
Department: Computer Science & Engineering

───────────────────────────────────────────────────────────────
                    CERTIFICATE DETAILS
───────────────────────────────────────────────────────────────
Valid From: ${cert.validFrom}
Valid To: ${cert.validTo}
Duration: ${cert.duration}

Diagnosis/Purpose: ${cert.diagnosis}

───────────────────────────────────────────────────────────────
                        REMARKS
───────────────────────────────────────────────────────────────
${cert.remarks}

───────────────────────────────────────────────────────────────
                    ISSUING AUTHORITY
───────────────────────────────────────────────────────────────
Doctor: ${cert.doctor}
Department: ${cert.department}
Status: ${cert.status.toUpperCase()}

═══════════════════════════════════════════════════════════════
This is an official medical certificate issued by NIT Warangal 
Health Centre. This document is digitally generated and verified.
Generated on: ${new Date().toLocaleString()}
═══════════════════════════════════════════════════════════════
    `.trim();
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cert.certNo.replace(/\//g, '_')}_${cert.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Certificate downloaded successfully");
  };

  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <ClipboardList className="h-5 w-5" />
            </div>
            {cert.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              {cert.status}
            </Badge>
            <Badge variant="outline">{cert.certNo}</Badge>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Student Name</p>
              <p className="font-medium">{cert.studentName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Roll Number</p>
              <p className="font-medium">{cert.rollNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Issuing Doctor</p>
              <p className="font-medium">{cert.doctor}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department</p>
              <p className="font-medium">{cert.department}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="bg-primary/5 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Certificate Validity</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valid From</p>
                <p className="font-medium">{cert.validFrom}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valid To</p>
                <p className="font-medium">{cert.validTo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{cert.duration}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Diagnosis / Purpose</h4>
            <p className="text-muted-foreground">{cert.diagnosis}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Remarks</h4>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm">{cert.remarks}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex gap-2">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={handlePrint} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const HealthServicesSection = () => {
  return (
    <section className="py-20" id="health-services">
      <div className="container mx-auto px-4 bg-white/92 backdrop-blur-sm rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">
            Health Services
          </span>
          <h2 className="section-title">Your Health Dashboard</h2>
          <p className="section-subtitle">
            Access all your health services, records, and appointments in one place
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Book Appointment */}
          <ServiceCard
            icon={Calendar}
            title="Book Appointment"
            description="Schedule OPD visits with doctors"
            color="bg-blue-100 text-blue-600"
            href="/appointments"
          >
            <div className="space-y-4 mt-4">
              <h4 className="font-semibold">Upcoming Appointments</h4>
              {DUMMY_APPOINTMENTS.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="h-8 w-8 text-primary bg-primary/10 p-1.5 rounded-full" />
                    <div>
                      <p className="font-medium">{apt.doctor}</p>
                      <p className="text-sm text-muted-foreground">{apt.specialty}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{apt.date}</p>
                    <p className="text-xs text-muted-foreground">{apt.time}</p>
                    <Badge variant={apt.status === "confirmed" ? "default" : "secondary"} className="mt-1">
                      {apt.status}
                    </Badge>
                  </div>
                </div>
              ))}
              <Button className="w-full" asChild>
                <Link to="/appointments">Book New Appointment</Link>
              </Button>
            </div>
          </ServiceCard>

          {/* Health Records - Now Functional */}
          <ServiceCard
            icon={FileHeart}
            title="Health Records"
            description="View your medical history"
            color="bg-rose-100 text-rose-600"
          >
            <div className="space-y-4 mt-4">
              <h4 className="font-semibold">Recent Records</h4>
              {DUMMY_HEALTH_RECORDS.map((record) => {
                const RecordIcon = getRecordIcon(record.type);
                return (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-full ${getRecordTypeColor(record.type)}`}>
                        <RecordIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{record.title}</p>
                        <p className="text-xs text-muted-foreground">{record.date} • {record.size}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <RecordDetailDialog record={record}>
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </RecordDetailDialog>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const content = `${record.title}\n${record.date}\n\n${record.summary}\n\n${record.details}\n\n${record.recommendations}`;
                          const blob = new Blob([content], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${record.title.replace(/\s+/g, '_')}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          toast.success("Downloaded");
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/health-dashboard">View All Records</Link>
              </Button>
            </div>
          </ServiceCard>

          {/* Visits */}
          <ServiceCard
            icon={Stethoscope}
            title="Visit History"
            description="Track your health centre visits"
            color="bg-purple-100 text-purple-600"
          >
            <div className="space-y-4 mt-4">
              <h4 className="font-semibold">Recent Visits</h4>
              {DUMMY_VISITS.map((visit) => (
                <div key={visit.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{visit.reason}</p>
                      <p className="text-sm text-muted-foreground">{visit.doctor}</p>
                    </div>
                    <Badge variant="outline">{visit.date}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm"><span className="text-muted-foreground">Diagnosis:</span> {visit.diagnosis}</p>
                    {visit.followUp && <Badge variant="secondary">Follow-up Required</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Rx: {visit.prescription}</p>
                </div>
              ))}
            </div>
          </ServiceCard>

          {/* Medical Certificates - Now Functional */}
          <ServiceCard
            icon={ClipboardList}
            title="Medical Certificates"
            description="Request & download certificates"
            color="bg-amber-100 text-amber-600"
          >
            <div className="space-y-4 mt-4">
              <h4 className="font-semibold">Your Certificates</h4>
              {DUMMY_CERTIFICATES.map((cert) => (
                <CertificateDetailDialog key={cert.id} cert={cert}>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="h-8 w-8 text-amber-600 bg-amber-100 p-1.5 rounded-full" />
                      <div>
                        <p className="font-medium text-sm">{cert.title}</p>
                        <p className="text-xs text-muted-foreground">{cert.doctor} • {cert.duration}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="bg-green-500 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {cert.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{cert.date}</p>
                    </div>
                  </div>
                </CertificateDetailDialog>
              ))}
              <Button variant="outline" className="w-full">Request New Certificate</Button>
            </div>
          </ServiceCard>

          {/* Health Check-ups */}
          <ServiceCard
            icon={UserCheck}
            title="Health Check-ups"
            description="Preventive care programs"
            color="bg-green-100 text-green-600"
          >
            <div className="space-y-4 mt-4">
              <h4 className="font-semibold">Upcoming Check-ups</h4>
              {DUMMY_CHECKUPS.map((checkup) => (
                <div key={checkup.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{checkup.name}</p>
                    <Badge variant={checkup.status === "scheduled" ? "default" : "secondary"}>
                      {checkup.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Clock className="h-4 w-4" />
                    {checkup.date}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">📍 {checkup.venue}</p>
                  <div className="flex flex-wrap gap-1">
                    {checkup.tests.map((test) => (
                      <Badge key={test} variant="outline" className="text-xs">{test}</Badge>
                    ))}
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">Schedule Health Check-up</Button>
            </div>
          </ServiceCard>

          {/* Digital Health Records */}
          <ServiceCard
            icon={Shield}
            title="Digital Health Records"
            description="ABHA integrated records"
            color="bg-indigo-100 text-indigo-600"
          >
            <div className="space-y-4 mt-4">
              <h4 className="font-semibold">Your Digital Locker</h4>
              <div className="grid grid-cols-2 gap-3">
                {DUMMY_DIGITAL_RECORDS.map((record) => {
                  const RecIcon = record.icon;
                  return (
                    <div key={record.id} className="p-3 bg-muted/50 rounded-lg text-center hover:bg-muted transition-colors cursor-pointer">
                      <RecIcon className="h-6 w-6 mx-auto mb-1 text-primary" />
                      <p className="text-2xl font-bold text-primary">{record.count}</p>
                      <p className="text-xs font-medium">{record.category}</p>
                      <p className="text-xs text-muted-foreground">Updated: {record.lastUpdated}</p>
                    </div>
                  );
                })}
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center mb-3">
                  Your records are securely stored and linked with your ABHA ID
                </p>
                <Button className="w-full" asChild>
                  <Link to="/health-dashboard">Access Digital Locker</Link>
                </Button>
              </div>
            </div>
          </ServiceCard>
        </div>
      </div>
    </section>
  );
};

export default HealthServicesSection;
