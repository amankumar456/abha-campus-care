import { Shield, Lock, UserCheck } from "lucide-react";

const SecurityBanner = () => {
  return (
    <section className="py-12 bg-accent">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Security Message */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-secondary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                Your Data, Your Control
              </h3>
              <p className="text-muted-foreground">
                Multi-person approval system ensures no unauthorized access to your health records
              </p>
            </div>
          </div>

          {/* Security Features */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-5 w-5 text-secondary" />
              <span className="text-sm font-medium">End-to-End Encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserCheck className="h-5 w-5 text-secondary" />
              <span className="text-sm font-medium">Consent-Based Access</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5 text-secondary" />
              <span className="text-sm font-medium">ABDM Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityBanner;
