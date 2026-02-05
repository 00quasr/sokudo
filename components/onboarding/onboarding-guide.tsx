'use client';

import { useState, useEffect } from 'react';
import { X, Check, ChevronRight, ChevronLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export interface OnboardingStep {
  id: number;
  stepKey: string;
  title: string;
  description: string;
  content: string;
  category: string;
  stepOrder: number;
  isOptional: boolean;
}

export interface UserProgress {
  stepId: number;
  completed: boolean;
  skipped: boolean;
}

interface OnboardingGuideProps {
  steps: OnboardingStep[];
  userProgress: UserProgress[];
  onComplete: (stepId: number) => Promise<void>;
  onSkip: (stepId: number) => Promise<void>;
  onClose: () => void;
}

export function OnboardingGuide({
  steps,
  userProgress,
  onComplete,
  onSkip,
  onClose,
}: OnboardingGuideProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Find the first incomplete step
  useEffect(() => {
    const firstIncomplete = steps.findIndex((step) => {
      const progress = userProgress.find((p) => p.stepId === step.id);
      return !progress?.completed && !progress?.skipped;
    });
    if (firstIncomplete !== -1) {
      setCurrentStepIndex(firstIncomplete);
    }
  }, [steps, userProgress]);

  const currentStep = steps[currentStepIndex];
  const currentProgress = userProgress.find((p) => p.stepId === currentStep?.id);
  const completedCount = userProgress.filter((p) => p.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = (completedCount / totalSteps) * 100;

  const handleComplete = async () => {
    if (!currentStep || currentProgress?.completed) return;

    setIsLoading(true);
    try {
      await onComplete(currentStep.id);

      // Move to next step
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!currentStep || !currentStep.isOptional) return;

    setIsLoading(true);
    try {
      await onSkip(currentStep.id);

      // Move to next step
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  if (!currentStep) {
    return null;
  }

  const isCompleted = currentProgress?.completed || false;
  const isSkipped = currentProgress?.skipped || false;

  return (
    <Card className="w-full max-w-2xl mx-auto border-2 shadow-lg">
      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-orange-500" />
            <Badge variant="outline" className="text-xs">
              {currentStep.category}
            </Badge>
            {currentStep.isOptional && (
              <Badge variant="secondary" className="text-xs">
                Optional
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="default" className="text-xs bg-green-600">
                <Check className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
            {isSkipped && (
              <Badge variant="secondary" className="text-xs">
                Skipped
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4">
          <CardTitle className="text-xl">{currentStep.title}</CardTitle>
          <CardDescription className="mt-1">
            {currentStep.description}
          </CardDescription>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
            <span>{completedCount} completed</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-base leading-relaxed">{currentStep.content}</p>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-6">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentStepIndex === steps.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="flex gap-2">
          {currentStep.isOptional && !isSkipped && !isCompleted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={isLoading}
            >
              Skip
            </Button>
          )}
          {!isCompleted && (
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isLoading ? (
                'Marking...'
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Mark Complete
                </>
              )}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
