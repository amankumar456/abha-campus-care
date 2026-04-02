import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Mail, Send, CheckCircle, XCircle, Megaphone, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const DisclaimerSection = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error("Please fill in all fields");
      return;
    }
    setSending(true);
    // Simulate send — in production, wire to an edge function or email API
    await new Promise((r) => setTimeout(r, 1200));
    toast.success("Message sent successfully! We'll get back to you soon.");
    setForm({ name: "", email: "", subject: "", message: "" });
    setSending(false);
  };

  return (
    <section className="py-16 bg-destructive/5 border-y-2 border-destructive/20">
      <div className="container mx-auto px-4 max-w-5xl space-y-10">
        {/* Disclaimer Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/30">
            <ShieldAlert className="w-5 h-5 text-destructive" />
            <span className="text-sm font-bold text-destructive uppercase tracking-wide">Important Disclaimer</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            NIT Warangal Health Centre – Personal Project
          </h2>
        </div>

        {/* Main Disclaimer Card */}
        <Card className="border-destructive/30 bg-background shadow-lg">
          <CardContent className="pt-6 space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              This project is a <strong className="text-foreground">personal academic initiative</strong>. The data used in this project is publicly available data sourced from the official NIT Warangal website. All roll numbers and phone numbers displayed are <strong className="text-foreground">dummy data</strong> created for demonstration purposes only and do not represent real individuals.
            </p>

            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">
                  ⚠️ This project is NOT officially accepted or endorsed by NIT Warangal
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  I have already informed and described this project to the NIT Warangal administration. For any queries, clarifications, or concerns, please contact me below.
                </p>
              </div>
            </div>

            {/* Key Points */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                <span>This is <strong>my own personal project</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                <span>Data = <strong>public data</strong> from NIT Warangal website</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                <span>Roll numbers & phones = <strong>dummy / fake data</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Megaphone className="w-4 h-4 text-primary shrink-0" />
                <span>Already <strong>informed</strong> to NIT Warangal administration</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="w-4 h-4 text-destructive shrink-0" />
                <span><strong>NOT officially accepted</strong> by NIT Warangal</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span>Contact: <strong>akkumarsingh456@gmail.com</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Contact Me
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Have questions or concerns? Reach out using the form below or email{" "}
              <a href="mailto:akkumarsingh456@gmail.com" className="text-primary underline font-medium">
                akkumarsingh456@gmail.com
              </a>
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
              <Input
                placeholder="Your Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={100}
              />
              <Input
                type="email"
                placeholder="Your Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                maxLength={255}
              />
              <div className="sm:col-span-2">
                <Input
                  placeholder="Subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                  maxLength={200}
                />
              </div>
              <div className="sm:col-span-2">
                <Textarea
                  placeholder="Your Message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  maxLength={1000}
                  rows={4}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={sending} className="gap-2">
                  <Send className="w-4 h-4" />
                  {sending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default DisclaimerSection;
