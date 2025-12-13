import { Database, Github, Menu, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function Header({ onRefresh, isLoading }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Database className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">Capitol AI</span>
              <span className="text-[10px] text-muted-foreground font-mono">Data Ingestion Pipeline</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
