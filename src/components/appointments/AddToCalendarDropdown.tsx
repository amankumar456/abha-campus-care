import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CalendarPlus, Download, ExternalLink } from "lucide-react";

interface AddToCalendarDropdownProps {
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  reason?: string | null;
  location?: string;
}

export default function AddToCalendarDropdown({
  appointmentDate,
  appointmentTime,
  doctorName,
  reason,
  location = "NIT Warangal Health Centre",
}: AddToCalendarDropdownProps) {
  const { toast } = useToast();

  // Create Date objects for start and end times
  const startDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // 30 min appointment

  const title = `Appointment with ${doctorName}`;
  const description = reason
    ? `Reason: ${reason}\n\nHealth Centre Appointment`
    : "Health Centre Appointment";

  // Format dates for different calendar formats
  const formatForGoogle = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  const formatForICS = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  // Google Calendar URL
  const handleGoogleCalendar = () => {
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${formatForGoogle(startDateTime)}/${formatForGoogle(endDateTime)}`,
      details: description,
      location: location,
      sf: "true",
    });

    window.open(
      `https://calendar.google.com/calendar/render?${params.toString()}`,
      "_blank"
    );

    toast({
      title: "Opening Google Calendar",
      description: "Add the event to your calendar.",
    });
  };

  // Outlook Calendar URL
  const handleOutlookCalendar = () => {
    const params = new URLSearchParams({
      path: "/calendar/action/compose",
      rru: "addevent",
      subject: title,
      body: description,
      startdt: startDateTime.toISOString(),
      enddt: endDateTime.toISOString(),
      location: location,
    });

    window.open(
      `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`,
      "_blank"
    );

    toast({
      title: "Opening Outlook Calendar",
      description: "Add the event to your calendar.",
    });
  };

  // Download ICS file for Apple Calendar and other apps
  const handleDownloadICS = () => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//NITW Health Centre//Appointment//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `DTSTART:${formatForICS(startDateTime)}`,
      `DTEND:${formatForICS(endDateTime)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
      `LOCATION:${location}`,
      `STATUS:CONFIRMED`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `appointment-${format(startDateTime, "yyyy-MM-dd")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Calendar File Downloaded",
      description: "Open the .ics file to add to your calendar app.",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <CalendarPlus className="w-4 h-4 mr-1" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleGoogleCalendar} className="cursor-pointer">
          <ExternalLink className="w-4 h-4 mr-2" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOutlookCalendar} className="cursor-pointer">
          <ExternalLink className="w-4 h-4 mr-2" />
          Outlook Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadICS} className="cursor-pointer">
          <Download className="w-4 h-4 mr-2" />
          Download .ics File
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
