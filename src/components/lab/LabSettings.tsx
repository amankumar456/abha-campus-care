import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, User, Bell, Shield, Save, Mail, Phone, Building2 } from "lucide-react";

export default function LabSettings() {
  const { user } = useUserRole();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    displayName: "",
    email: "",
    phone: "",
    department: "Laboratory",
  });

  const [notifications, setNotifications] = useState({
    newSamples: true,
    urgentTests: true,
    completionAlerts: true,
    emailNotifications: false,
  });

  useEffect(() => {
    if (user) {
      setProfile({
        displayName: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
        email: user.email || "",
        phone: user.user_metadata?.phone || "",
        department: "Laboratory",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profile.displayName,
          phone: profile.phone,
        },
      });
      if (error) throw error;
      toast({ title: "Settings saved", description: "Your profile has been updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const initials = profile.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "LO";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Settings className="w-5 h-5" /> Settings
        </h2>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" /> Profile Information
          </CardTitle>
          <CardDescription>Your personal details and role</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-[#1e3a8a] text-white text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{profile.displayName || "Lab Officer"}</p>
              <Badge variant="secondary" className="mt-1">Lab Officer</Badge>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Full Name
              </Label>
              <Input
                id="displayName"
                value={profile.displayName}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </Label>
              <Input id="email" value={profile.email} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Phone
              </Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="Contact number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Department
              </Label>
              <Input id="department" value={profile.department} disabled className="bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notification Preferences
          </CardTitle>
          <CardDescription>Choose what alerts you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">New Sample Registrations</p>
              <p className="text-xs text-muted-foreground">Get notified when new samples are registered</p>
            </div>
            <Switch
              checked={notifications.newSamples}
              onCheckedChange={(v) => setNotifications({ ...notifications, newSamples: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Urgent Test Alerts</p>
              <p className="text-xs text-muted-foreground">Priority alerts for critical or urgent tests</p>
            </div>
            <Switch
              checked={notifications.urgentTests}
              onCheckedChange={(v) => setNotifications({ ...notifications, urgentTests: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Completion Alerts</p>
              <p className="text-xs text-muted-foreground">Notify when test results are finalized</p>
            </div>
            <Switch
              checked={notifications.completionAlerts}
              onCheckedChange={(v) => setNotifications({ ...notifications, completionAlerts: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              checked={notifications.emailNotifications}
              onCheckedChange={(v) => setNotifications({ ...notifications, emailNotifications: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" /> Security
          </CardTitle>
          <CardDescription>Account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm font-medium">Last Sign In</p>
              <p className="text-xs text-muted-foreground">
                {user?.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleString()
                  : "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm font-medium">Account Created</p>
              <p className="text-xs text-muted-foreground">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
