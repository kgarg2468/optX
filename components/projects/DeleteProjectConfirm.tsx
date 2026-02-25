"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteProjectConfirmProps {
  open: boolean;
  projectName: string;
  isDeleting?: boolean;
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onDelete: () => Promise<void> | void;
}

export function DeleteProjectConfirm({
  open,
  projectName,
  isDeleting = false,
  error = null,
  onOpenChange,
  onDelete,
}: DeleteProjectConfirmProps) {
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>Delete Project?</DialogTitle>
              <DialogDescription>
                This will permanently delete <strong>{projectName}</strong> and
                all associated data, scenarios, and simulation results.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => setStep(2)}>
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Final confirmation</DialogTitle>
              <DialogDescription>
                This action cannot be undone. Permanently delete this project?
              </DialogDescription>
            </DialogHeader>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isDeleting}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={() => void onDelete()}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Yes, permanently delete"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
