import { ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center">
                <span className="text-background font-bold text-sm">NIT</span>
              </div>
              <span className="font-semibold">NIT Warangal</span>
            </div>
            <p className="text-background/70 text-sm leading-relaxed">
              National Institute of Technology Warangal - A Premier Technical Institution committed to excellence in education and healthcare.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="#" className="hover:text-background transition-colors">Student Registration</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Doctor Portal</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Book Appointment</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Health Records</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Emergency Services</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li>
                <a href="https://abdm.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-background transition-colors inline-flex items-center gap-1">
                  ABDM Portal <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="https://abha.abdm.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-background transition-colors inline-flex items-center gap-1">
                  Create ABHA <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li><a href="#" className="hover:text-background transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Data Protection</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <address className="text-sm text-background/70 not-italic space-y-2">
              <p>Health Centre, NIT Campus</p>
              <p>Warangal, Telangana - 506004</p>
              <p className="pt-2">
                <strong className="text-background">Emergency:</strong> +91 870 246 2087
              </p>
              <p>
                <strong className="text-background">Email:</strong> healthcentre@nitw.ac.in
              </p>
            </address>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/50">
            © {new Date().getFullYear()} NIT Warangal Health Centre. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-background/50">
            <span>Powered by</span>
            <span className="font-semibold text-background/70">ABHA - Ayushman Bharat Health Account</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
