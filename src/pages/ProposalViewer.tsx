import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundWrapper from "@/components/layout/BackgroundWrapper";

const ProposalViewer = () => {
  return (
    <BackgroundWrapper>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-4">Project Guide / Proposal</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This document outlines the project proposal for the NIT Warangal Health Centre portal. Preview only — download is disabled.
        </p>
        <div className="w-full bg-card border border-border rounded-lg overflow-hidden" style={{ height: "80vh" }}>
          <iframe
            src="/proposal_for_health_centre.pdf#toolbar=0&navpanes=0&scrollbar=1"
            className="w-full h-full"
            title="Project Proposal PDF"
            style={{ border: "none" }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          ⚠️ This document is for reference only. Download is not permitted.
        </p>
      </main>
      <Footer />
    </BackgroundWrapper>
  );
};

export default ProposalViewer;
