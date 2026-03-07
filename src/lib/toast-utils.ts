import { toast } from "sonner";

export function showSuccess(message: string) {
  toast.dismiss();
  toast.success(message);
}

export function showError(message: string) {
  toast.dismiss();
  toast.error(message);
}

const MAX_TEXT_LENGTH = 500;

export function checkMaxLength(value: string, field = "Text"): boolean {
  if (value.length > MAX_TEXT_LENGTH) {
    showError(`${field} is too long (max ${MAX_TEXT_LENGTH} characters)`);
    return false;
  }
  return true;
}
