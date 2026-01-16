import { Link } from "react-router-dom";
import { GraduationCap, Stethoscope, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-health-center.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="NIT Warangal Health Center" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-fade-in">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white/90 text-sm font-medium">ABHA Integrated Health Portal</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-slide-in-left">
            NIT Warangal
            <span className="block text-white/90">Health Centre</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-white/80 mb-8 max-w-xl animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Digital healthcare platform for students, faculty & staff. Seamlessly connected with Ayushman Bharat Digital Mission for comprehensive health management.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Link to="/student/register">
              <Button className="btn-hero-primary group w-full sm:w-auto">
                <GraduationCap className="h-5 w-5" />
                Student Registration
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button className="btn-hero-secondary group">
              <Stethoscope className="h-5 w-5" />
              Medical Staff Access
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20 animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <div>
              <p className="text-3xl font-bold text-white">2,450+</p>
              <p className="text-white/70 text-sm">Active Students</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">98%</p>
              <p className="text-white/70 text-sm">Vaccination Rate</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">24/7</p>
              <p className="text-white/70 text-sm">Emergency Care</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
