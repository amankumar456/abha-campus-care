import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Download, Printer, TestTube } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LabReportViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  reportFileUrl: string | null;
  reportFileName?: string | null;
}

const getSignedUrl = async (storagePath: string): Promise<string | null> => {
  if (storagePath.startsWith("http")) return storagePath;
  const { data, error } = await supabase.storage.from("lab-reports").createSignedUrl(storagePath, 3600);
  if (error) { console.error("Signed URL error:", error); return null; }
  return data.signedUrl;
};

export async function openLabReport(reportFileUrl: string) {
  const url = await getSignedUrl(reportFileUrl);
  if (!url) return false;
  if (reportFileUrl.endsWith(".html")) {
    const res = await fetch(url);
    const html = await res.text();
    const blob = new Blob([html], { type: "text/html" });
    window.open(URL.createObjectURL(blob), "_blank");
  } else {
    window.open(url, "_blank");
  }
  return true;
}

export async function printLabReport(reportFileUrl: string) {
  const url = await getSignedUrl(reportFileUrl);
  if (!url) return false;
  if (reportFileUrl.endsWith(".html")) {
    const res = await fetch(url);
    const html = await res.text();
    const blob = new Blob([html], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    const w = window.open(blobUrl, "_blank");
    if (w) w.addEventListener("load", () => setTimeout(() => w.print(), 600));
  } else {
    const w = window.open(url, "_blank");
    if (w) w.addEventListener("load", () => setTimeout(() => w.print(), 600));
  }
  return true;
}

export default function LabReportViewer({ open, onOpenChange, title, reportFileUrl }: LabReportViewerProps) {
  const { toast } = useToast();
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadContent = async () => {
    if (!reportFileUrl) return;
    setLoading(true);
    try {
      const url = await getSignedUrl(reportFileUrl);
      if (!url) throw new Error("Could not get URL");
      setSignedUrl(url);
      if (reportFileUrl.endsWith(".html")) {
        const res = await fetch(url);
        const html = await res.text();
        setHtmlContent(html);
      } else {
        setHtmlContent(null);
      }
    } catch {
      toast({ title: "Error", description: "Could not load report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (val: boolean) => {
    if (val && reportFileUrl) loadContent();
    if (!val) { setHtmlContent(null); setSignedUrl(null); }
    onOpenChange(val);
  };

  const handlePrint = () => {
    if (htmlContent) {
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank");
      if (w) w.addEventListener("load", () => setTimeout(() => w.print(), 600));
    } else if (signedUrl) {
      const w = window.open(signedUrl, "_blank");
      if (w) w.addEventListener("load", () => setTimeout(() => w.print(), 600));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <TestTube className="w-4 h-4 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 w-full rounded-lg border overflow-hidden bg-white relative">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">Loading report...</div>
          ) : htmlContent ? (
            <iframe srcDoc={htmlContent} className="w-full h-full border-0" title="Lab Report" />
          ) : signedUrl ? (
            <iframe src={signedUrl} className="w-full h-full border-0" title="Lab Report" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">No report available</div>
          )}
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" size="sm" onClick={() => {
            if (htmlContent) {
              const blob = new Blob([htmlContent], { type: "text/html" });
              window.open(URL.createObjectURL(blob), "_blank");
            } else if (signedUrl) {
              window.open(signedUrl, "_blank");
            }
          }}>
            <Eye className="w-4 h-4 mr-1" />Open in New Tab
          </Button>
          <Button variant="default" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" />Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
