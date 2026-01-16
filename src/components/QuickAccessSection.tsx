import { Link } from "react-router-dom";
import { 
  Calendar, 
  FileHeart, 
  Pill, 
  Stethoscope, 
  ClipboardList, 
  UserCheck,
  ArrowRight
} from "lucide-react";

const quickAccessItems = [
  {
    icon: Calendar,
    title: "Book Appointment",
    description: "Schedule OPD visits",
    href: "/appointments"
  },
  {
    icon: FileHeart,
    title: "Health Records",
    description: "View your medical history",
    href: "#health-services"
  },
  {
    icon: Pill,
    title: "Pharmacy",
    description: "Prescription & medications",
    href: "#health-services"
  },
  {
    icon: Stethoscope,
    title: "Specialist Visits",
    description: "Book specialist consultations",
    href: "/medical-team"
  },
  {
    icon: ClipboardList,
    title: "Medical Certificates",
    description: "Request sick leave docs",
    href: "#health-services"
  },
  {
    icon: UserCheck,
    title: "Health Check-ups",
    description: "Preventive care programs",
    href: "#health-services"
  }
];

const QuickAccessSection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 bg-white/92 backdrop-blur-sm rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="section-title">Quick Access</h2>
          <p className="section-subtitle">
            Fast access to the services you use most frequently
          </p>
        </div>

        {/* Quick Access Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickAccessItems.map((item) => (
            item.href.startsWith('/') ? (
              <Link 
                key={item.title}
                to={item.href}
                className="card-quick-access flex items-center gap-4"
              >
                <div className="icon-container-primary shrink-0">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {item.description}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
              </Link>
            ) : (
              <a 
                key={item.title}
                href={item.href}
                className="card-quick-access flex items-center gap-4"
              >
                <div className="icon-container-primary shrink-0">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {item.description}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
              </a>
            )
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickAccessSection;
