import { useState } from "react";
import {
  Zap,
  Ambulance,
  Phone,
  UserSearch,
  FileText,
  Shield,
  Siren,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const EMERGENCY_CONTACTS = {
  ambulance: { name: "Campus Ambulance", phone: "0870-246-2088" },
  security: { name: "Security Control Room", phone: "0870-246-2087" },
  hospital: { name: "City General ER", phone: "0870-246-1111" },
  police: { name: "Police (100)", phone: "100" },
};

export default function EmergencyQuickActions() {
  const actions = [
    {
      icon: Ambulance,
      label: "Dispatch Ambulance",
      color: "text-destructive",
      bg: "bg-destructive/10 hover:bg-destructive/20",
      onClick: () => {
        window.location.href = `tel:${EMERGENCY_CONTACTS.ambulance.phone}`;
        toast.info("Calling campus ambulance...");
      },
    },
    {
      icon: Building2,
      label: "Alert Hospital ER",
      color: "text-amber-600",
      bg: "bg-amber-500/10 hover:bg-amber-500/20",
      onClick: () => {
        window.location.href = `tel:${EMERGENCY_CONTACTS.hospital.phone}`;
        toast.info("Calling hospital emergency...");
      },
    },
    {
      icon: Phone,
      label: "Call On-Duty Doctor",
      color: "text-primary",
      bg: "bg-primary/10 hover:bg-primary/20",
      onClick: () => {
        toast.info("Connecting to on-call doctor...");
      },
    },
    {
      icon: Shield,
      label: "Call Security",
      color: "text-secondary",
      bg: "bg-secondary/10 hover:bg-secondary/20",
      onClick: () => {
        window.location.href = `tel:${EMERGENCY_CONTACTS.security.phone}`;
        toast.info("Calling security...");
      },
    },
    {
      icon: UserSearch,
      label: "Find Patient Records",
      color: "text-primary",
      bg: "bg-primary/10 hover:bg-primary/20",
      onClick: () => {
        toast.info("Use the Records tab to search for patient records");
      },
    },
    {
      icon: FileText,
      label: "Emergency Forms",
      color: "text-muted-foreground",
      bg: "bg-muted hover:bg-muted/80",
      onClick: () => {
        toast.info("Opening emergency documentation forms...");
      },
    },
  ];

  return (
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
  );
}
