const normalizePhoneNumber = (phoneNumber: string) => phoneNumber.replace(/\D/g, '');

export const buildWhatsAppUrl = (phoneNumber = '', message?: string) => {
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  if (!normalizedPhoneNumber) {
    return message
      ? `https://wa.me/?text=${encodeURIComponent(message)}`
      : 'https://wa.me/';
  }

  return message
    ? `https://wa.me/${normalizedPhoneNumber}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${normalizedPhoneNumber}`;
};

export const openExternalUrl = (url: string) => {
  if (typeof window === 'undefined') return;

  const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');

  if (openedWindow) {
    openedWindow.opener = null;
  }
};

export const openWhatsAppChat = (phoneNumber = '', message?: string) => {
  openExternalUrl(buildWhatsAppUrl(phoneNumber, message));
};
