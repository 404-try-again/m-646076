
import { cn } from "@/lib/utils";

interface OnlineIndicatorProps {
  isOnline: boolean;
  className?: string;
}

export const OnlineIndicator = ({ isOnline, className }: OnlineIndicatorProps) => {
  return (
    <div 
      className={cn(
        "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background",
        isOnline ? "bg-green-500" : "bg-gray-400",
        className
      )}
    />
  );
};
