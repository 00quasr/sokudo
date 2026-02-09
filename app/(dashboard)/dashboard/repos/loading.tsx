import { Loader2 } from 'lucide-react';

export default function ReposLoading() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 text-white/50 animate-spin" />
    </div>
  );
}
