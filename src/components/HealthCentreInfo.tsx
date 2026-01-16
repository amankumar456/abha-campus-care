import { Clock, MapPin, Phone, Mail } from "lucide-react";

const HealthCentreInfo = () => {
  return (
    <section className="py-20 bg-muted/30" id="about">
      <div className="container mx-auto px-4">
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
                    Health Centre Building, NIT Warangal Campus<br />
                    Warangal, Telangana - 506004
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Card */}
          <div className="bg-primary text-primary-foreground rounded-2xl p-8 lg:p-10" id="contact">
            <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-primary-foreground/70 text-sm">Emergency Helpline</p>
                  <a href="tel:+918702462087" className="text-xl font-semibold hover:underline">
                    +91 870 246 2087
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-primary-foreground/70 text-sm">General Enquiry</p>
                  <a href="tel:+918702462000" className="text-xl font-semibold hover:underline">
                    +91 870 246 2000
                  </a>
                </div>
              </div>

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

            {/* Specialist Services */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <h4 className="font-semibold mb-3">Visiting Specialists</h4>
              <div className="flex flex-wrap gap-2">
                {["Orthopaedics", "Dermatology", "Gynaecology", "Ophthalmology", "Psychiatry"].map((spec) => (
                  <span 
                    key={spec}
                    className="px-3 py-1 bg-white/10 rounded-full text-sm"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HealthCentreInfo;
