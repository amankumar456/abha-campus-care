import { 
  FileText, 
  QrCode, 
  Shield, 
  Users, 
  Building2, 
  Smartphone 
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Digital Health Records",
    description: "Secure digital locker for all your medical records, prescriptions, and lab reports accessible anytime.",
    color: "primary"
  },
  {
    icon: QrCode,
    title: "QR Code Sharing",
    description: "Generate time-bound QR codes for instant, secure sharing of health records with authorized doctors.",
    color: "secondary"
  },
  {
    icon: Shield,
    title: "Consent-Based Access",
    description: "Complete control over who can view your health data with easy grant and revoke capabilities.",
    color: "primary"
  },
  {
    icon: Users,
    title: "Unified Patient View",
    description: "Doctors get comprehensive health history for accurate diagnosis and better treatment plans.",
    color: "secondary"
  },
  {
    icon: Building2,
    title: "Hospital Integration",
    description: "Connected with ABDM-enabled hospitals, labs, and clinics across India for seamless care.",
    color: "primary"
  },
  {
    icon: Smartphone,
    title: "Mobile Access",
    description: "Access your complete health profile from any device, anywhere with our responsive platform.",
    color: "secondary"
  }
];

const FeaturesSection = () => {
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
              className="card-feature group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={feature.color === "primary" ? "icon-container-primary" : "icon-container-secondary"}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
