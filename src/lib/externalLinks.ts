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
  if (typeof document === 'undefined') return;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.referrerPolicy = 'no-referrer';
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

export const openWhatsAppChat = (phoneNumber = '', message?: string) => {
  openExternalUrl(buildWhatsAppUrl(phoneNumber, message));
};
