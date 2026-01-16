import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  QrCode, 
  Shield, 
  Users, 
  Building2, 
  Smartphone,
  X,
  Download,
  Share2,
  Clock,
  Check
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

const features = [
  {
    id: "digital-records",
    icon: FileText,
    title: "Digital Health Records",
    description: "Secure digital locker for all your medical records, prescriptions, and lab reports accessible anytime.",
    color: "primary",
    action: "view-records"
  },
  {
    id: "qr-code",
    icon: QrCode,
    title: "QR Code Sharing",
    description: "Generate time-bound QR codes for instant, secure sharing of health records with authorized doctors.",
    color: "secondary",
    action: "generate-qr"
  },
  {
    id: "consent-access",
    icon: Shield,
    title: "Consent-Based Access",
    description: "Complete control over who can view your health data with easy grant and revoke capabilities.",
    color: "primary",
    action: "manage-consent"
  },
  {
    id: "unified-view",
    icon: Users,
    title: "Unified Patient View",
    description: "Doctors get comprehensive health history for accurate diagnosis and better treatment plans.",
    color: "secondary",
    action: "patient-view"
  },
  {
    id: "hospital-integration",
    icon: Building2,
    title: "Hospital Integration",
    description: "Connected with ABDM-enabled hospitals, labs, and clinics across India for seamless care.",
    color: "primary",
    action: "hospitals"
  },
  {
    id: "mobile-access",
    icon: Smartphone,
    title: "Mobile Access",
    description: "Access your complete health profile from any device, anywhere with our responsive platform.",
    color: "secondary",
    action: "mobile-app"
  }
];

const FeaturesSection = () => {
  const navigate = useNavigate();
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  const [recordsDialogOpen, setRecordsDialogOpen] = useState(false);

  const handleFeatureClick = (action: string) => {
    switch (action) {
      case "hospitals":
        // Smooth scroll to hospital integration section
        const hospitalSection = document.getElementById("hospitals");
        if (hospitalSection) {
          hospitalSection.scrollIntoView({ behavior: "smooth" });
        }
        break;
      case "generate-qr":
        setQrDialogOpen(true);
        break;
      case "manage-consent":
        setConsentDialogOpen(true);
        break;
      case "view-records":
        setRecordsDialogOpen(true);
        break;
      case "patient-view":
        navigate("/auth");
        toast({
          title: "Sign in Required",
          description: "Please sign in to access unified patient view.",
        });
        break;
      case "mobile-app":
        toast({
          title: "Mobile App Coming Soon!",
          description: "Our mobile app is under development. Stay tuned!",
        });
        break;
      default:
        break;
    }
  };

  // Generate a dummy QR code data URL
  const generateQRCodeSVG = () => {
    // Simple QR-like pattern for demo
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <rect fill="white" width="200" height="200"/>
        <g fill="#1a365d">
          <rect x="20" y="20" width="40" height="40"/>
          <rect x="140" y="20" width="40" height="40"/>
          <rect x="20" y="140" width="40" height="40"/>
          <rect x="80" y="20" width="20" height="20"/>
          <rect x="80" y="60" width="20" height="20"/>
          <rect x="100" y="80" width="20" height="20"/>
          <rect x="120" y="60" width="20" height="20"/>
          <rect x="60" y="80" width="20" height="20"/>
          <rect x="20" y="100" width="20" height="20"/>
          <rect x="60" y="120" width="20" height="20"/>
          <rect x="100" y="100" width="20" height="20"/>
          <rect x="120" y="140" width="20" height="20"/>
          <rect x="140" y="120" width="20" height="20"/>
          <rect x="160" y="100" width="20" height="20"/>
          <rect x="80" y="160" width="20" height="20"/>
          <rect x="140" y="160" width="20" height="20"/>
        </g>
      </svg>
    `)}`;
  };

  return (
    <section className="py-20" id="services">
      <div className="container mx-auto px-4 bg-white/92 backdrop-blur-sm rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            ABHA Integrated Features
          </span>
          <h2 className="section-title">
            Comprehensive Digital Health Services
          </h2>
          <p className="section-subtitle">
            Experience the future of healthcare with Ayushman Bharat Health Account integration, 
            providing secure and accessible health management for the entire campus community.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="card-feature group cursor-pointer transform transition-all hover:scale-105 hover:shadow-lg"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => handleFeatureClick(feature.action)}
            >
              <div className={feature.color === "primary" ? "icon-container-primary" : "icon-container-secondary"}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
              <div className="mt-4 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Click to explore →
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Share Health Records via QR
            </DialogTitle>
            <DialogDescription>
              Generate a time-bound QR code for secure sharing with doctors
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-xl border-2 border-primary/20 shadow-lg">
                <img 
                  src={generateQRCodeSVG()} 
                  alt="Health Records QR Code" 
                  className="w-48 h-48"
                />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Valid for 15 minutes</span>
            </div>
            <div className="space-y-2">
              <Badge variant="outline" className="w-full justify-center py-2">
                Scan with any ABDM-compliant app
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                toast({ title: "QR Code Downloaded", description: "QR code saved to your device." });
              }}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button className="flex-1" onClick={() => {
                toast({ title: "Link Copied!", description: "Shareable link copied to clipboard." });
              }}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Consent Management Dialog */}
      <Dialog open={consentDialogOpen} onOpenChange={setConsentDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Consent-Based Access
            </DialogTitle>
            <DialogDescription>
              Manage who can access your health records
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {[
                { name: "Dr. Aman Kumar", role: "Medical Officer", access: true, email: "akkumarsingh456@gmail.com" },
                { name: "Health Centre", role: "Institution", access: true, email: "health@nitw.ac.in" },
                { name: "Faculty Mentor", role: "Mentor", access: true, email: "mentor@nitw.ac.in" },
              ].map((entity, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div>
                    <p className="font-medium">{entity.name}</p>
                    <p className="text-sm text-muted-foreground">{entity.role}</p>
                    <p className="text-xs text-muted-foreground">{entity.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {entity.access ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        <Check className="w-3 h-3 mr-1" />
                        Granted
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Revoked</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={() => {
              navigate("/auth");
              setConsentDialogOpen(false);
            }}>
              Sign in to manage all consents
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Digital Records Dialog */}
      <Dialog open={recordsDialogOpen} onOpenChange={setRecordsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Digital Health Records
            </DialogTitle>
            <DialogDescription>
              Your secure digital health locker
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: "Prescriptions", count: 12, icon: "💊" },
                { type: "Lab Reports", count: 5, icon: "🔬" },
                { type: "Visit Records", count: 8, icon: "📋" },
                { type: "Vaccinations", count: 3, icon: "💉" },
              ].map((item, idx) => (
                <div key={idx} className="p-4 bg-muted/50 rounded-lg border text-center">
                  <span className="text-2xl">{item.icon}</span>
                  <p className="font-semibold mt-2">{item.count}</p>
                  <p className="text-sm text-muted-foreground">{item.type}</p>
                </div>
              ))}
            </div>
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-center text-muted-foreground">
                Your records are encrypted and ABDM-compliant. Only authorized personnel with your consent can access them.
              </p>
            </div>
            <Button className="w-full" onClick={() => {
              navigate("/auth");
              setRecordsDialogOpen(false);
            }}>
              Sign in to view all records
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default FeaturesSection;