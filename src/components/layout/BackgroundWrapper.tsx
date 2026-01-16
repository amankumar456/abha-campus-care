import { ReactNode } from "react";
import nitwBackground from "@/assets/nitw-main-campus.png";

interface BackgroundWrapperProps {
  children: ReactNode;
  className?: string;
}

const BackgroundWrapper = ({ children, className = "" }: BackgroundWrapperProps) => {
  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Background Image with Blur and Overlay */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `url(${nitwBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundAttachment: 'fixed',
          filter: 'blur(2px)',
        }}
      />
      
      {/* Overlay for readability */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.65)',
        }}
      />
      
      {/* Content */}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
};

export default BackgroundWrapper;
