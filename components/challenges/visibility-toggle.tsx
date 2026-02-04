'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Globe, Lock } from 'lucide-react';
import { useState } from 'react';

interface VisibilityToggleProps {
  defaultChecked?: boolean;
}

export function VisibilityToggle({ defaultChecked = false }: VisibilityToggleProps) {
  const [isPublic, setIsPublic] = useState(defaultChecked);

  return (
    <div className="flex items-center gap-3">
      <Switch
        id="isPublic"
        checked={isPublic}
        onCheckedChange={setIsPublic}
        aria-label="Challenge visibility"
      />
      <input type="hidden" name="isPublic" value={isPublic ? 'on' : ''} />
      <Label htmlFor="isPublic" className="flex items-center gap-2 text-sm font-normal cursor-pointer">
        {isPublic ? (
          <>
            <Globe className="h-4 w-4 text-green-500" />
            <span>
              Public
              <span className="text-muted-foreground ml-1">
                &mdash; visible to other users
              </span>
            </span>
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 text-gray-400" />
            <span>
              Private
              <span className="text-muted-foreground ml-1">
                &mdash; only you can see this
              </span>
            </span>
          </>
        )}
      </Label>
    </div>
  );
}
