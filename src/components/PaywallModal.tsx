interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// SolarMatch is fully free — the paywall modal is permanently disabled.
export default function PaywallModal(_: PaywallModalProps) {
  return null;
}
