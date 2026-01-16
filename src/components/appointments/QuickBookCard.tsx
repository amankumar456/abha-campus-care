import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Plus, Thermometer, Stethoscope, Brain, Activity, Syringe, HelpCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

const QUICK_BOOK_REASONS = [
  { id: 'fever', label: 'Fever/Cold', icon: Thermometer, color: 'bg-red-100 text-red-600 hover:bg-red-200' },
  { id: 'injury', label: 'Injury', icon: Activity, color: 'bg-orange-100 text-orange-600 hover:bg-orange-200' },
  { id: 'mental', label: 'Mental Wellness', icon: Brain, color: 'bg-purple-100 text-purple-600 hover:bg-purple-200' },
  { id: 'checkup', label: 'Check-up', icon: Stethoscope, color: 'bg-blue-100 text-blue-600 hover:bg-blue-200' },
  { id: 'vaccination', label: 'Vaccination', icon: Syringe, color: 'bg-green-100 text-green-600 hover:bg-green-200' },
  { id: 'other', label: 'Other', icon: HelpCircle, color: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
];

const VISIT_REASONS = [
  { value: 'fever', label: 'Fever/Cold' },
  { value: 'headache', label: 'Headache' },
  { value: 'stomach', label: 'Stomach Issue' },
  { value: 'injury', label: 'Injury' },
  { value: 'skin', label: 'Skin Problem' },
  { value: 'mental', label: 'Mental Health' },
  { value: 'checkup', label: 'General Check-up' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'followup', label: 'Follow-up Visit' },
  { value: 'other', label: 'Other' },
];

interface QuickBookCardProps {
  onQuickBook?: (reason: string) => void;
}

const QuickBookCard = ({ onQuickBook }: QuickBookCardProps) => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>();
  const [reason, setReason] = useState<string>("");

  const handleQuickBook = (reasonId: string) => {
    navigate(`/appointments?reason=${reasonId}`);
  };

  const handleCheckAvailability = () => {
    if (date) {
      navigate(`/appointments?date=${format(date, 'yyyy-MM-dd')}&reason=${reason}`);
    } else {
      navigate('/appointments');
    }
  };

  return (
    <Card className="h-full bg-white/95 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <Plus className="w-5 h-5 text-green-600" />
          </div>
          Quick Book
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Booking Form */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm">Preferred Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Reason for Visit</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {VISIT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            className="w-full" 
            onClick={handleCheckAvailability}
          >
            Check Availability
          </Button>
        </div>

        {/* Quick Book Buttons */}
        <div className="pt-3 border-t">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Quick Actions
          </p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_BOOK_REASONS.map((reason) => (
              <Button
                key={reason.id}
                variant="ghost"
                className={cn("flex flex-col h-auto py-3 px-2", reason.color)}
                onClick={() => handleQuickBook(reason.id)}
              >
                <reason.icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{reason.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickBookCard;
