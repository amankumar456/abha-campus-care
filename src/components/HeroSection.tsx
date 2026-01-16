import { Link } from "react-router-dom";
import { GraduationCap, Stethoscope, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/nitw-building.png";

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
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/60 to-primary/40" />
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
          <div className="animate-fade-in max-w-2xl" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 italic">
              # For the Heart, From the Heart.
            </h2>
            <p className="text-lg text-white/90 mb-4 leading-relaxed">
              At NIT Warangal, we know the weight on your shoulders—the late nights, the relentless pressure, the silent stress. You're here to build a future, but sometimes you just need someone to see you, to hear you, to help.
            </p>
            <p className="text-lg text-white/85 mb-4 leading-relaxed">
              This is more than a health portal. It's a quiet promise.
            </p>
            <p className="text-base text-white/80 mb-4 leading-relaxed">
              A promise that your well-being matters as much as your grades. That it's okay to not be okay. That support is just a click away—discreet, compassionate, and always here.
            </p>
            <p className="text-lg text-white/90 font-medium mb-4">
              Take a breath. We're with you.
            </p>
            <p className="text-xl text-white font-bold mt-6">
              Because your greatest project is yourself.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Link to="/student/register">
              <Button className="btn-hero-primary group w-full sm:w-auto">
                <GraduationCap className="h-5 w-5" />
                Student Registration
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/doctor/register">
              <Button className="btn-hero-secondary group w-full sm:w-auto">
                <Stethoscope className="h-5 w-5" />
                Medical Staff Access
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
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
