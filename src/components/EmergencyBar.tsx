import { Phone, Clock, AlertTriangle } from "lucide-react";

const EmergencyBar = () => {
  return (
    <div className="emergency-bar">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 animate-pulse-soft">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">24/7 Emergency Services</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-white/80">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Always Available</span>
          </div>
        </div>
        <a 
          href="tel:+918702462087" 
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-all duration-300 font-bold"
        >
          <Phone className="h-5 w-5" />
          <span>+91 870 246 2087</span>
        </a>
      </div>
    </div>
  );
};

export default EmergencyBar;
