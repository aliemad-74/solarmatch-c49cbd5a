interface LimitReachedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// SolarMatch is fully free — the report limit modal is permanently disabled.
export default function LimitReachedModal(_: LimitReachedModalProps) {
  return null;
}
