export interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  action: () => Promise<void> | void;
  confirmLabel: string;
  isDelete?: boolean;
}
