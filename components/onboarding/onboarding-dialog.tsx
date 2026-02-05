'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OnboardingGuide, type OnboardingStep, type UserProgress } from './onboarding-guide';

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: OnboardingStep[];
  userProgress: UserProgress[];
  onComplete: (stepId: number) => Promise<void>;
  onSkip: (stepId: number) => Promise<void>;
}

export function OnboardingDialog({
  open,
  onOpenChange,
  steps,
  userProgress,
  onComplete,
  onSkip,
}: OnboardingDialogProps) {
  const [isOpen, setIsOpen] = useState(open);

  const handleClose = () => {
    setIsOpen(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <OnboardingGuide
          steps={steps}
          userProgress={userProgress}
          onComplete={onComplete}
          onSkip={onSkip}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}
