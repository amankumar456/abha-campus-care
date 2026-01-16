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
  Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Dummy Appointments Data
const DUMMY_APPOINTMENTS = [
  { id: 1, doctor: "Dr. Rajesh Kumar", specialty: "General Medicine", date: "Jan 20, 2026", time: "10:00 AM", status: "confirmed" },
  { id: 2, doctor: "Dr. Suresh Menon", specialty: "Orthopaedics", date: "Jan 22, 2026", time: "11:30 AM", status: "pending" },
  { id: 3, doctor: "Dr. Priya Sharma", specialty: "General Surgery", date: "Jan 25, 2026", time: "02:00 PM", status: "confirmed" },
  { id: 4, doctor: "Dr. Meera Krishnan", specialty: "Gynaecology", date: "Jan 27, 2026", time: "09:30 AM", status: "pending" },
];

// Dummy Health Records
const DUMMY_HEALTH_RECORDS = [
  { id: 1, title: "Annual Health Checkup 2025", date: "Dec 15, 2025", type: "Report", size: "2.4 MB" },
  { id: 2, title: "Blood Test Results", date: "Jan 05, 2026", type: "Lab Report", size: "1.1 MB" },
  { id: 3, title: "X-Ray Chest Report", date: "Nov 20, 2025", type: "Radiology", size: "5.2 MB" },
  { id: 4, title: "Prescription - General Checkup", date: "Jan 10, 2026", type: "Prescription", size: "0.5 MB" },
];

// Dummy Visits
const DUMMY_VISITS = [
  { id: 1, date: "Jan 15, 2026", doctor: "Dr. Rajesh Kumar", reason: "Fever & Cold", diagnosis: "Viral Infection", followUp: true },
  { id: 2, date: "Jan 08, 2026", doctor: "Dr. Anil Reddy", reason: "Routine Checkup", diagnosis: "Healthy", followUp: false },
  { id: 3, date: "Dec 20, 2025", doctor: "Dr. Sanjay Gupta", reason: "Stress & Anxiety", diagnosis: "Mild Anxiety", followUp: true },
  { id: 4, date: "Nov 15, 2025", doctor: "Dr. Kavitha Rao", reason: "Stomach Pain", diagnosis: "Gastritis", followUp: false },
];

// Dummy Medical Certificates
const DUMMY_CERTIFICATES = [
  { id: 1, title: "Medical Leave Certificate", date: "Jan 12, 2026", doctor: "Dr. Rajesh Kumar", duration: "3 days", status: "approved" },
  { id: 2, title: "Fitness Certificate - Sports", date: "Jan 05, 2026", doctor: "Dr. Priya Sharma", duration: "1 year", status: "approved" },
  { id: 3, title: "Medical Leave Certificate", date: "Dec 10, 2025", doctor: "Dr. Anil Reddy", duration: "2 days", status: "approved" },
  { id: 4, title: "Fitness Certificate - NSS", date: "Nov 28, 2025", doctor: "Dr. Kavitha Rao", duration: "6 months", status: "approved" },
];

// Dummy Health Checkups
const DUMMY_CHECKUPS = [
  { id: 1, name: "Annual Health Screening", date: "Feb 15, 2026", status: "scheduled", tests: ["Blood Test", "ECG", "Eye Test", "Dental Check"] },
  { id: 2, name: "Vaccination Drive - Flu Shot", date: "Feb 01, 2026", status: "upcoming", tests: ["Influenza Vaccine"] },
  { id: 3, name: "Mental Wellness Assessment", date: "Mar 10, 2026", status: "upcoming", tests: ["Counseling Session", "Stress Assessment"] },
  { id: 4, name: "Dental Checkup Camp", date: "Feb 20, 2026", status: "upcoming", tests: ["Dental Examination", "Cleaning"] },
];

// Dummy Digital Health Records
const DUMMY_DIGITAL_RECORDS = [
  { id: 1, category: "Prescriptions", count: 12, lastUpdated: "Jan 15, 2026" },
  { id: 2, category: "Lab Reports", count: 8, lastUpdated: "Jan 10, 2026" },
  { id: 3, category: "Radiology", count: 3, lastUpdated: "Nov 20, 2025" },
  { id: 4, category: "Vaccination Records", count: 5, lastUpdated: "Dec 01, 2025" },
  { id: 5, category: "Discharge Summaries", count: 1, lastUpdated: "Oct 15, 2025" },
  { id: 6, category: "Medical Certificates", count: 6, lastUpdated: "Jan 12, 2026" },
];

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

          {/* Health Records */}
          <ServiceCard
            icon={FileHeart}
            title="Health Records"
            description="View your medical history"
            color="bg-rose-100 text-rose-600"
          >
            <div className="space-y-4 mt-4">
              <h4 className="font-semibold">Recent Records</h4>
              {DUMMY_HEALTH_RECORDS.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-rose-600 bg-rose-100 p-1.5 rounded-full" />
                    <div>
                      <p className="font-medium">{record.title}</p>
                      <p className="text-sm text-muted-foreground">{record.date} • {record.size}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
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
                </div>
              ))}
            </div>
          </ServiceCard>

          {/* Medical Certificates */}
          <ServiceCard
            icon={ClipboardList}
            title="Medical Certificates"
            description="Request & download certificates"
            color="bg-amber-100 text-amber-600"
          >
            <div className="space-y-4 mt-4">
              <h4 className="font-semibold">Your Certificates</h4>
              {DUMMY_CERTIFICATES.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="h-8 w-8 text-amber-600 bg-amber-100 p-1.5 rounded-full" />
                    <div>
                      <p className="font-medium">{cert.title}</p>
                      <p className="text-sm text-muted-foreground">{cert.doctor} • {cert.duration}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {cert.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{cert.date}</p>
                  </div>
                </div>
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
            icon={FileText}
            title="Digital Health Records"
            description="ABHA integrated records"
            color="bg-indigo-100 text-indigo-600"
          >
            <div className="space-y-4 mt-4">
              <h4 className="font-semibold">Your Digital Locker</h4>
              <div className="grid grid-cols-2 gap-3">
                {DUMMY_DIGITAL_RECORDS.map((record) => (
                  <div key={record.id} className="p-3 bg-muted/50 rounded-lg text-center hover:bg-muted transition-colors cursor-pointer">
                    <p className="text-2xl font-bold text-primary">{record.count}</p>
                    <p className="text-sm font-medium">{record.category}</p>
                    <p className="text-xs text-muted-foreground">Updated: {record.lastUpdated}</p>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center mb-3">
                  Your records are securely stored and linked with your ABHA ID
                </p>
                <Button className="w-full">Access Digital Locker</Button>
              </div>
            </div>
          </ServiceCard>
        </div>
      </div>
    </section>
  );
};

export default HealthServicesSection;
