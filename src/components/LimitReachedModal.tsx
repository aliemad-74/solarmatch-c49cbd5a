import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Mail, Phone, MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl } from '@/lib/externalLinks';

interface LimitReachedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LimitReachedModal({ open, onOpenChange }: LimitReachedModalProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const whatsappContactLink = buildWhatsAppUrl('201111009619', 'I would like to generate more solar reports');

  const handleContact = (method: 'email' | 'phone') => {
    switch (method) {
      case 'email':
        window.open('mailto:support@solarmatch.eg?subject=Request%20More%20Reports', '_blank');
        break;
      case 'phone':
        window.open('tel:+201111009619', '_blank');
        break;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <DialogTitle className="text-xl font-display">
            {t('limitReached.title')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t('limitReached.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            {t('limitReached.contactUs')}
          </p>

          <div className="grid gap-3">
            <Button variant="outline" className="w-full justify-start gap-3" asChild>
              <a
                href={whatsappContactLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onOpenChange(false)}
              >
                <MessageCircle className="w-5 h-5 text-solar-green" />
                <span>{t('limitReached.whatsapp')}</span>
              </a>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => handleContact('email')}
            >
              <Mail className="w-5 h-5 text-primary" />
              <span>{t('limitReached.email')}</span>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => handleContact('phone')}
            >
              <Phone className="w-5 h-5 text-solar-gold" />
              <span>{t('limitReached.phone')}</span>
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              {t('limitReached.upgradeInfo')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
