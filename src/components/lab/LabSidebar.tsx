import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, ClipboardList, Users, Bell, BarChart3, Settings, 
  FlaskConical, ChevronLeft, ChevronRight, TestTubes
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LabSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: "overview", label: "Dashboard Home", icon: LayoutDashboard },
  { id: "register", label: "Register Sample", icon: FlaskConical, highlight: true },
  { id: "processing", label: "Processing Queue", icon: TestTubes },
  { id: "completed", label: "Completed Tests", icon: ClipboardList },
  { id: "students", label: "Student Records", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function LabSidebar({ activeSection, onSectionChange }: LabSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "bg-[#1e3a8a] text-white flex flex-col transition-all duration-300 relative",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
          <FlaskConical className="w-5 h-5 text-orange-400" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold leading-tight">Lab Officer</p>
            <p className="text-[10px] text-white/60">NIT Warangal</p>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 py-2 space-y-0.5 px-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              activeSection === item.id 
                ? "bg-white/20 text-white font-medium" 
                : item.highlight
                  ? "text-orange-300 hover:bg-orange-500/20 hover:text-orange-200 font-medium"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <item.icon className={cn("w-4 h-4 flex-shrink-0", item.highlight && activeSection !== item.id && "text-orange-400")} />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#1e3a8a] border-2 border-white/20 text-white hover:bg-[#1e3a8a]/90"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </Button>
    </aside>
  );
}
