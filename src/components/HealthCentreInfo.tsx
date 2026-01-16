import { Clock, MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const HealthCentreInfo = () => {
  const handleCall = (number: string) => {
    window.location.href = `tel:${number.replace(/[^0-9+]/g, '')}`;
  };

  const handleWhatsApp = (number: string) => {
    const cleanNumber = number.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/91${cleanNumber}`, '_blank');
  };

  return (
    <section className="py-20" id="about">
      <div className="container mx-auto px-4 bg-white/92 backdrop-blur-sm rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Info Content */}
          <div>
            <span className="inline-block px-4 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">
              Health Centre Services
            </span>
            <h2 className="section-title text-left">
              Dedicated to Campus Wellness
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              The NIT Warangal Health Centre provides comprehensive medical services to students, 
              faculty, and staff. Our team of qualified medical professionals is committed to 
              ensuring the health and well-being of the entire campus community.
            </p>

            {/* Service Hours */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
                <div className="icon-container-primary shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">OPD Timings</h4>
                  <p className="text-muted-foreground">Monday - Saturday: 9:00 AM - 5:00 PM</p>
                  <p className="text-sm text-secondary font-medium mt-1">Emergency: 24/7 Available</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
                <div className="icon-container-primary shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Location</h4>
                  <p className="text-muted-foreground">
                    National Institute of Technology, Warangal<br />
                    Hanumkonda, Warangal - 506004, TS, INDIA
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Card */}
          <div className="bg-primary text-primary-foreground rounded-2xl p-8 lg:p-10" id="contact">
            <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
            
            <div className="space-y-5">
              {/* IHC Phone */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-primary-foreground/70 text-sm">Institute Health Centre</p>
                  <p className="text-xl font-semibold">0870-2462099</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => handleCall('0870-2462099')}
                    className="bg-white/20 hover:bg-white/30 text-white border-0"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => handleWhatsApp('8702462099')}
                    className="bg-green-500/80 hover:bg-green-500 text-white border-0"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* General Campus 1 */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-primary-foreground/70 text-sm">General Campus</p>
                  <p className="text-xl font-semibold">+91-870-2459191</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => handleCall('+91-870-2459191')}
                    className="bg-white/20 hover:bg-white/30 text-white border-0"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => handleWhatsApp('8702459191')}
                    className="bg-green-500/80 hover:bg-green-500 text-white border-0"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* General Campus 2 */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-primary-foreground/70 text-sm">Institute Facilities</p>
                  <p className="text-xl font-semibold">+91-870-2459547</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => handleCall('+91-870-2459547')}
                    className="bg-white/20 hover:bg-white/30 text-white border-0"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => handleWhatsApp('8702459547')}
                    className="bg-green-500/80 hover:bg-green-500 text-white border-0"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-primary-foreground/70 text-sm">Email</p>
                  <a href="mailto:healthcentre@nitw.ac.in" className="text-lg font-semibold hover:underline">
                    healthcentre@nitw.ac.in
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HealthCentreInfo;
