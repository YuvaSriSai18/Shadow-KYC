import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Step {
  id: string;
  label: string;
  completed: boolean;
}

interface ProgressTrackerProps {
  steps: Step[];
}

export const ProgressTracker = ({ steps }: ProgressTrackerProps) => {
  return (
    <Card className="bg-gradient-card border-border/50">
      <CardContent className="p-6">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    step.completed
                      ? "border-success bg-success text-success-foreground"
                      : "border-border bg-background"
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-12 transition-colors duration-300 ${
                      step.completed ? "bg-success" : "bg-border"
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 pt-1">
                <p
                  className={`text-sm font-medium transition-colors duration-300 ${
                    step.completed ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
