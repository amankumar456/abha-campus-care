import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Zap,
  Ambulance,
  Phone,
  UserSearch,
  FileText,
  Shield,
  Building2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function EmergencyQuickActions() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [onCallDialogOpen, setOnCallDialogOpen] = useState(false);

  // Fetch real ambulance service contacts
  const { data: ambulanceServices } = useQuery({
    queryKey: ["ambulance-service-contacts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ambulance_service")
        .select("id, phone_landline, phone_mobile, is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  const ambulancePhone = ambulanceServices?.[0]?.phone_mobile || "108";
  const healthCentrePhone = ambulanceServices?.[0]?.phone_landline || "0870-2462099";

  // Fetch on-call doctors
  const { data: onCallDoctors } = useQuery({
    queryKey: ["on-call-doctors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("medical_officers")
        .select("id, name, designation, phone_mobile, phone_office")
        .order("name");
      return data || [];
    },
    enabled: onCallDialogOpen,
  });

  // Patient search
  const { data: searchResults } = useQuery({
    queryKey: ["patient-search-quick", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const { data } = await supabase
        .from("students")
        .select("id, full_name, roll_number, program, batch")
        .or(`full_name.ilike.%${searchQuery}%,roll_number.ilike.%${searchQuery}%`)
        .limit(10);
      return data || [];
    },
    enabled: searchQuery.length >= 2,
  });

  const actions = [
    {
      icon: Ambulance,
      label: "Dispatch Ambulance",
      color: "text-destructive",
      bg: "bg-destructive/10 hover:bg-destructive/20",
      onClick: () => {
        window.location.href = `tel:${ambulancePhone}`;
        toast.info(`Calling campus ambulance: ${ambulancePhone}`);
      },
    },
    {
      icon: Building2,
      label: "Alert Health Centre",
      color: "text-amber-600",
      bg: "bg-amber-500/10 hover:bg-amber-500/20",
      onClick: () => {
        window.location.href = `tel:${healthCentrePhone}`;
        toast.info(`Calling Health Centre: ${healthCentrePhone}`);
      },
    },
    {
      icon: Phone,
      label: "Call On-Duty Doctor",
      color: "text-primary",
      bg: "bg-primary/10 hover:bg-primary/20",
      onClick: () => setOnCallDialogOpen(true),
    },
    {
      icon: Shield,
      label: "Call Security",
      color: "text-secondary",
      bg: "bg-secondary/10 hover:bg-secondary/20",
      onClick: () => {
        window.location.href = `tel:0870-2462087`;
        toast.info("Calling Security Control Room");
      },
    },
    {
      icon: UserSearch,
      label: "Find Patient Records",
      color: "text-primary",
      bg: "bg-primary/10 hover:bg-primary/20",
      onClick: () => setSearchOpen(true),
    },
    {
      icon: FileText,
      label: "Emergency Forms",
      color: "text-muted-foreground",
      bg: "bg-muted hover:bg-muted/80",
      onClick: () => {
        navigate("/medical-leave");
        toast.info("Opening medical leave & emergency forms");
      },
    },
  ];

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Emergency Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${action.bg} cursor-pointer`}
                >
                  <Icon className={`h-6 w-6 ${action.color}`} />
                  <span className="text-xs font-medium text-center">{action.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* On-Call Doctor Dialog */}
      <Dialog open={onCallDialogOpen} onOpenChange={setOnCallDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              On-Duty Medical Officers
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {onCallDoctors?.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium text-sm">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.designation}</p>
                </div>
                <div className="flex gap-2">
                  {doc.phone_mobile?.[0] && (
                    <a
                      href={`tel:${doc.phone_mobile[0]}`}
                      className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                      onClick={() => toast.info(`Calling ${doc.name}...`)}
                    >
                      <Phone className="h-4 w-4 text-primary" />
                    </a>
                  )}
                  {doc.phone_office && (
                    <a
                      href={`tel:${doc.phone_office}`}
                      className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </div>
            ))}
            {!onCallDoctors?.length && (
              <p className="text-center text-muted-foreground py-4 text-sm">No doctors found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Patient Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserSearch className="h-5 w-5 text-primary" />
              Find Patient Records
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Search by name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <div className="max-h-[50vh] overflow-y-auto space-y-1">
              {searchResults?.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    navigate(`/student-profile/${s.roll_number}`);
                    setSearchOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-sm">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">{s.roll_number} • {s.program}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{s.batch}</Badge>
                </button>
              ))}
              {searchQuery.length >= 2 && !searchResults?.length && (
                <p className="text-center text-muted-foreground py-4 text-sm">No students found</p>
              )}
              {searchQuery.length < 2 && (
                <p className="text-center text-muted-foreground py-4 text-sm">Type at least 2 characters to search</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
