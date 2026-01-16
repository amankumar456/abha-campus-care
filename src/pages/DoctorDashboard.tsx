import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Calendar,
  FileCheck,
  Bell,
  Clock,
  Search,
  Filter,
  ChevronRight,
  Stethoscope,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data
const mockDoctor = {
  name: "Dr. Priya Sharma",
  title: "Consultant Physician",
  department: "General OPD",
  approvalLevel: "Level 3",
};

const mockStats = [
  { label: "Today's Appointments", value: "12", icon: Calendar, color: "text-primary" },
  { label: "Pending Approvals", value: "5", icon: FileCheck, color: "text-warning" },
  { label: "Active Patients", value: "48", icon: Users, color: "text-secondary" },
  { label: "Urgent Alerts", value: "2", icon: AlertTriangle, color: "text-destructive" },
];

const mockAppointments = [
  { id: 1, patient: "Rahul Kumar", rollNo: "21CS1234", time: "9:00 AM", type: "General Checkup", status: "waiting" },
  { id: 2, patient: "Sneha Reddy", rollNo: "20EC2345", time: "9:30 AM", type: "Follow-up", status: "in-progress" },
  { id: 3, patient: "Amit Singh", rollNo: "22ME3456", time: "10:00 AM", type: "Consultation", status: "scheduled" },
  { id: 4, patient: "Priyanka Das", rollNo: "21EE4567", time: "10:30 AM", type: "Vaccination", status: "scheduled" },
];

const mockAccessRequests = [
  { id: 1, requester: "Dr. Rajesh Verma", patient: "Rahul Kumar", type: "Medical History", time: "10 mins ago", priority: "normal" },
  { id: 2, requester: "Nurse Staff", patient: "Emergency Case", type: "Emergency Access", time: "2 mins ago", priority: "urgent" },
  { id: 3, requester: "Lab Technician", patient: "Sneha Reddy", type: "Lab Reports", time: "1 hour ago", priority: "normal" },
];

const mockRecentPatients = [
  { id: 1, name: "Rahul Kumar", rollNo: "21CS1234", lastVisit: "Today", condition: "Fever, Cold" },
  { id: 2, name: "Sneha Reddy", rollNo: "20EC2345", lastVisit: "Yesterday", condition: "Follow-up" },
  { id: 3, name: "Vikram Patel", rollNo: "19ME5678", lastVisit: "2 days ago", condition: "Injury" },
];

export default function DoctorDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div className="hidden sm:block">
                  <p className="font-semibold text-foreground">NIT Warangal</p>
                  <p className="text-xs text-muted-foreground">Health Portal - Doctor</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                        PS
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium">{mockDoctor.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{mockDoctor.name}</p>
                    <p className="text-xs text-muted-foreground">{mockDoctor.title}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Good Morning, {mockDoctor.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {mockDoctor.title} • {mockDoctor.department} • {mockDoctor.approvalLevel} Access
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {mockStats.map((stat) => (
            <Card key={stat.label} className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Appointments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Bar */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients by name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>

            {/* Today's Appointments */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Today's Appointments
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{apt.patient}</p>
                        <p className="text-sm text-muted-foreground">
                          {apt.rollNo} • {apt.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {apt.time}
                        </p>
                        <Badge
                          variant={
                            apt.status === "in-progress"
                              ? "default"
                              : apt.status === "waiting"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {apt.status === "in-progress" ? "In Progress" : apt.status === "waiting" ? "Waiting" : "Scheduled"}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Patients */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-secondary" />
                  Recent Patients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockRecentPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            {patient.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">{patient.rollNo}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{patient.lastVisit}</p>
                        <p className="text-sm text-foreground">{patient.condition}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Access Requests & Quick Actions */}
          <div className="space-y-6">
            {/* Access Requests */}
            <Card className="border-l-4 border-l-warning">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-warning" />
                  Pending Access Requests
                  <Badge variant="secondary" className="ml-auto">
                    {mockAccessRequests.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockAccessRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-3 rounded-lg border ${
                      request.priority === "urgent"
                        ? "border-destructive/50 bg-destructive/5"
                        : "bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-foreground text-sm">{request.requester}</p>
                        <p className="text-xs text-muted-foreground">
                          {request.type} • {request.patient}
                        </p>
                      </div>
                      {request.priority === "urgent" && (
                        <Badge variant="destructive" className="text-xs">
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{request.time}</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 h-8 text-xs bg-secondary hover:bg-secondary/90">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                        <XCircle className="w-3 h-3 mr-1" />
                        Deny
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Write Prescription
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Calendar className="w-4 h-4 text-secondary" />
                  Schedule Follow-up
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileCheck className="w-4 h-4 text-muted-foreground" />
                  Issue Medical Certificate
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  Refer to Specialist
                </Button>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="bg-accent/50 border-accent">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-secondary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-foreground">Security Reminder</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      All data access is logged. Ensure proper authorization before viewing patient records.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
