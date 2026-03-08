import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { format, startOfDay, isAfter } from "date-fns";
import {
  Pill,
  LayoutDashboard,
  Package,
  ClipboardList,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Bell,
  AlertTriangle,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function PharmacyHomeDashboard() {
  const navigate = useNavigate();
  const { user } = useUserRole();

  const { data: prescriptions, isLoading: loadingPrescriptions } = useQuery({
    queryKey: ["pharmacy-home-prescriptions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("prescriptions")
        .select("id, diagnosis, created_at, student_id, doctor_id")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: dispensing, isLoading: loadingDispensing } = useQuery({
    queryKey: ["pharmacy-home-dispensing"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pharmacy_dispensing")
        .select("id, status, prescription_id, created_at, dispensed_at");
      return data || [];
    },
  });

  const { data: inventory, isLoading: loadingInventory } = useQuery({
    queryKey: ["pharmacy-home-inventory"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pharmacy_inventory")
        .select("id, medicine_name, quantity, reorder_level, expiry_date");
      return data || [];
    },
  });

  const isLoading = loadingPrescriptions || loadingDispensing || loadingInventory;

  const todayStart = startOfDay(new Date());
  const allPrescriptions = prescriptions || [];
  const allDispensing = dispensing || [];
  const allInventory = inventory || [];

  const dispensedIds = new Set(allDispensing.map(d => d.prescription_id));
  const dispensedStatusMap = new Map(allDispensing.map(d => [d.prescription_id, d.status]));

  const pendingCount = allPrescriptions.filter(p => {
    const status = dispensedStatusMap.get(p.id);
    return !status || status === "pending";
  }).length;

  const dispensedCount = allDispensing.filter(d => d.status === "dispensed").length;
  const deniedCount = allDispensing.filter(d => d.status === "denied").length;

  const todayPrescriptions = allPrescriptions.filter(p => isAfter(new Date(p.created_at), todayStart));
  const todayDispensed = allDispensing.filter(d => d.dispensed_at && isAfter(new Date(d.dispensed_at), todayStart));

  const lowStockItems = allInventory.filter(i => i.reorder_level && i.quantity <= i.reorder_level);
  const expiringItems = allInventory.filter(i => {
    if (!i.expiry_date) return false;
    const expiryDate = new Date(i.expiry_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow;
  });

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Pharmacist";

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border-emerald-500/20">
        <CardContent className="py-6 px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center shadow-md">
                <Pill className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Welcome, {displayName}
                </h1>
                <p className="text-muted-foreground">
                  Pharmacy Staff • NIT Warangal Health Centre
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/pharmacy/dashboard")}>
                <User className="h-4 w-4 mr-1" />
                Profile
              </Button>
              <Button size="sm" onClick={() => navigate("/pharmacy/dashboard")} className="bg-emerald-600 hover:bg-emerald-700">
                <LayoutDashboard className="h-4 w-4 mr-1" />
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className="border-amber-200 bg-amber-50/50 cursor-pointer hover:shadow-md hover:border-amber-400 transition-all"
          onClick={() => navigate("/pharmacy/dashboard?filter=pending")}
        >
          <CardContent className="pt-5 pb-4 text-center">
            <Clock className="h-6 w-6 text-amber-600 mx-auto mb-1" />
            <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card
          className="border-emerald-200 bg-emerald-50/50 cursor-pointer hover:shadow-md hover:border-emerald-400 transition-all"
          onClick={() => navigate("/pharmacy/dashboard?filter=dispensed")}
        >
          <CardContent className="pt-5 pb-4 text-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
            <p className="text-3xl font-bold text-foreground">{dispensedCount}</p>
            <p className="text-sm text-muted-foreground">Dispensed</p>
          </CardContent>
        </Card>
        <Card
          className="border-red-200 bg-red-50/50 cursor-pointer hover:shadow-md hover:border-red-400 transition-all"
          onClick={() => navigate("/pharmacy/dashboard?filter=denied")}
        >
          <CardContent className="pt-5 pb-4 text-center">
            <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
            <p className="text-3xl font-bold text-foreground">{deniedCount}</p>
            <p className="text-sm text-muted-foreground">Denied</p>
          </CardContent>
        </Card>
        <Card
          className="border-blue-200 bg-blue-50/50 cursor-pointer hover:shadow-md hover:border-blue-400 transition-all"
          onClick={() => navigate("/pharmacy/dashboard?tab=inventory")}
        >
          <CardContent className="pt-5 pb-4 text-center">
            <Package className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <p className="text-3xl font-bold text-foreground">{allInventory.length}</p>
            <p className="text-sm text-muted-foreground">Medicines</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Navigate to frequently used tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2 hover:border-emerald-300 hover:bg-emerald-50/50"
              onClick={() => navigate("/pharmacy/dashboard")}
            >
              <ClipboardList className="h-6 w-6 text-emerald-600" />
              <span className="text-sm font-medium">Prescriptions</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2 hover:border-blue-300 hover:bg-blue-50/50"
              onClick={() => navigate("/pharmacy/dashboard?tab=inventory")}
            >
              <Package className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium">Inventory</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2 hover:border-amber-300 hover:bg-amber-50/50"
              onClick={() => navigate("/pharmacy/dashboard")}
            >
              <Clock className="h-6 w-6 text-amber-600" />
              <span className="text-sm font-medium">Pending Orders</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2 hover:border-purple-300 hover:bg-purple-50/50"
              onClick={() => navigate("/medical-team")}
            >
              <User className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium">Medical Team</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts & Today's Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockItems.length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <Package className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Low Stock Alert</p>
                  <p className="text-xs text-amber-600">
                    {lowStockItems.length} medicine{lowStockItems.length > 1 ? "s" : ""} below reorder level
                  </p>
                </div>
              </div>
            )}
            {expiringItems.length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <Bell className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Expiry Warning</p>
                  <p className="text-xs text-red-600">
                    {expiringItems.length} medicine{expiringItems.length > 1 ? "s" : ""} expiring within 30 days
                  </p>
                </div>
              </div>
            )}
            {pendingCount > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Pending Prescriptions</p>
                  <p className="text-xs text-blue-600">
                    {pendingCount} prescription{pendingCount > 1 ? "s" : ""} awaiting dispensing
                  </p>
                </div>
              </div>
            )}
            {lowStockItems.length === 0 && expiringItems.length === 0 && pendingCount === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No active alerts</p>
            )}
          </CardContent>
        </Card>

        {/* Today's Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Activity</CardTitle>
            <CardDescription>{format(new Date(), "EEEE, MMMM d, yyyy")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">New Prescriptions</span>
              <Badge variant="secondary">{todayPrescriptions.length}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Dispensed Today</span>
              <Badge variant="secondary">{todayDispensed.length}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Total Inventory Items</span>
              <Badge variant="secondary">{allInventory.length}</Badge>
            </div>
            <Separator />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/pharmacy/dashboard")}
            >
              View Full Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Prescriptions</CardTitle>
          <CardDescription>Latest prescriptions received</CardDescription>
        </CardHeader>
        <CardContent>
          {allPrescriptions.slice(0, 5).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No prescriptions yet</p>
          ) : (
            <div className="space-y-2">
              {allPrescriptions.slice(0, 5).map((rx) => {
                const status = dispensedStatusMap.get(rx.id);
                return (
                  <div key={rx.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        status === "dispensed" ? "bg-emerald-500" : 
                        status === "denied" ? "bg-red-500" : "bg-amber-500"
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{rx.diagnosis || "No diagnosis"}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(rx.created_at), "MMM d, yyyy • hh:mm a")}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      status === "dispensed" ? "default" : 
                      status === "denied" ? "destructive" : "secondary"
                    }>
                      {status === "dispensed" ? "Dispensed" : status === "denied" ? "Denied" : "Pending"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
