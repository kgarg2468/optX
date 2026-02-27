"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProjectSwitchGuardProps {
  open: boolean;
  onStay: () => void;
  onDiscard: () => void;
}

export function ProjectSwitchGuard({
  open,
  onStay,
  onDiscard,
}: ProjectSwitchGuardProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onStay()}>
      <DialogContent className="max-w-md glass-card">
        <DialogHeader>
          <DialogTitle>Unsaved changes</DialogTitle>
          <DialogDescription>
            You have unsaved edits in this project. Switching projects now will
            discard those changes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onStay}>
            Stay
          </Button>
          <Button variant="destructive" onClick={onDiscard}>
            Discard changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
