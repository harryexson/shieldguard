import { AlertTriangle } from 'lucide-react';

// Persistent banner making the demonstration nature of this portal explicit.
// This is a secure demo: authentication is real (signed, verified sessions) but
// all data shown is sample/mock and not connected to any live production system.
export function DemoBanner() {
  return (
    <div className="flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-center text-xs font-medium text-amber-300">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span>
        Demonstration environment — sample/mock data only. Not a live production system.
      </span>
    </div>
  );
}
