"use client";

import * as React from "react";
import { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

interface ConfirmDialogState extends ConfirmOptions {
  open: boolean;
}

/**
 * Hook that returns a `confirm(options)` function which opens a confirmation
 * dialog and returns a Promise<boolean> that resolves when the user confirms
 * or cancels.
 *
 * Usage:
 * ```tsx
 * const { confirm, ConfirmDialog } = useConfirm();
 *
 * const handleDelete = async () => {
 *   const ok = await confirm({
 *     title: "Delete item?",
 *     description: "This action cannot be undone.",
 *     variant: "destructive",
 *   });
 *   if (ok) { ... }
 * };
 *
 * return <><ConfirmDialog />...</>
 * ```
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmDialogState>({ open: false });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions = {}): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ ...options, open: true });
    });
  }, []);

  const handleClose = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, open: false }));
    resolveRef.current?.(value);
    resolveRef.current = null;
  }, []);

  const ConfirmDialog = useCallback(
    () => (
      <ConfirmDialogComponent
        open={state.open}
        title={state.title}
        description={state.description}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        variant={state.variant}
        onConfirm={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    ),
    [state, handleClose]
  );

  return { confirm, ConfirmDialog };
}

// ─── Internal Component ────────────────────────────────────────────────────────

interface ConfirmDialogComponentProps extends ConfirmOptions {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialogComponent({
  open,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogComponentProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
