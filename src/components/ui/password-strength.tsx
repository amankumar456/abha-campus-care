import { useMemo } from "react";
import { calculatePasswordStrength } from "@/lib/security/validation";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  className?: string;
  showFeedback?: boolean;
}

export function PasswordStrength({ password, className, showFeedback = true }: PasswordStrengthProps) {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);
  
  if (!password) return null;
  
  const colors = {
    'weak': 'bg-destructive',
    'fair': 'bg-orange-500',
    'good': 'bg-yellow-500',
    'strong': 'bg-green-500',
    'very-strong': 'bg-green-600'
  };
  
  const widths = {
    'weak': 'w-1/5',
    'fair': 'w-2/5',
    'good': 'w-3/5',
    'strong': 'w-4/5',
    'very-strong': 'w-full'
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              colors[strength.label],
              widths[strength.label]
            )}
          />
        </div>
        <span className={cn(
          "text-xs font-medium capitalize",
          strength.label === 'weak' && "text-destructive",
          strength.label === 'fair' && "text-orange-500",
          strength.label === 'good' && "text-yellow-600",
          (strength.label === 'strong' || strength.label === 'very-strong') && "text-green-600"
        )}>
          {strength.label.replace('-', ' ')}
        </span>
      </div>
      
      {showFeedback && strength.feedback.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-0.5">
          {strength.feedback.map((tip, index) => (
            <li key={index} className="flex items-center gap-1">
              <span className="w-1 h-1 bg-muted-foreground rounded-full" />
              {tip}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
