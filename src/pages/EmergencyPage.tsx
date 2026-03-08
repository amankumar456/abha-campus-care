import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import {
  Siren,
  Activity,
  BarChart3,
  FileText,
  Zap,
  RefreshCw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import EmergencyDashboard from "@/components/doctor/EmergencyDashboard";
import EmergencyHistory from "@/components/doctor/EmergencyHistory";
import EmergencyReportsSection from "@/components/doctor/EmergencyReportsSection";
import EmergencyQuickActions from "@/components/doctor/EmergencyQuickActions";

export default function EmergencyPage() {
  const [subTab, setSubTab] = useState("live");
  const location = useLocation();
  const isStandalone = location.pathname === "/emergency";

  // Get active count for badge
  const { data: activeCount } = useQuery({
    queryKey: ["emergency-active-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("ambulance_requests")
        .select("id", { count: "exact", head: true })
        .in("status", ["requested", "dispatched", "arrived", "in_transit", "delivered"]);
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const content = (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-destructive/10">
          <Siren className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Emergency Operations
            {(activeCount || 0) > 0 && (
              <Badge variant="destructive" className="animate-pulse">{activeCount} Active</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            Real-time emergency management, treatment tracking & analytics
          </p>
        </div>
      </div>

      {/* Quick Actions - always visible */}
      <EmergencyQuickActions />

      {/* Sub-tabs */}
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="live" className="gap-1.5">
            <Activity className="h-4 w-4" />
            Live Queue
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <FileText className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-4">
          <EmergencyDashboard />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <EmergencyHistory />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <EmergencyReportsSection />
        </TabsContent>
      </Tabs>
    </div>
  );

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
