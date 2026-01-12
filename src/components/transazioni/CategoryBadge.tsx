import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  categoryName?: string | null;
  confidence?: number | null;
  confirmed?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CategoryBadge({
  categoryName,
  confidence,
  confirmed,
  onClick,
  className,
}: CategoryBadgeProps) {
  if (!categoryName) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "cursor-pointer hover:bg-muted/50 text-muted-foreground border-dashed",
          className
        )}
        onClick={onClick}
      >
        <HelpCircle className="h-3 w-3 mr-1" />
        Categorizza
      </Badge>
    );
  }

  const getConfidenceColor = () => {
    if (!confidence) return "bg-muted text-muted-foreground";
    if (confidence >= 90) return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    if (confidence >= 70) return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
  };

  const getConfidenceIcon = () => {
    if (confirmed) {
      return <Check className="h-3 w-3 mr-1" />;
    }
    if (confidence && confidence >= 70) {
      return <Sparkles className="h-3 w-3 mr-1" />;
    }
    return null;
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "cursor-pointer hover:opacity-80 transition-opacity",
        getConfidenceColor(),
        className
      )}
      onClick={onClick}
    >
      {getConfidenceIcon()}
      {categoryName}
      {confidence && !confirmed && (
        <span className="ml-1 text-xs opacity-70">{confidence}%</span>
      )}
    </Badge>
  );
}