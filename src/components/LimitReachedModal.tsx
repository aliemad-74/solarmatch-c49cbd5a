import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LimitReachedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LimitReachedModal({ open, onOpenChange }: LimitReachedModalProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

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
          <Button
            className="w-full gap-2"
            onClick={() => {
              onOpenChange(false);
              navigate('/pricing');
            }}
          >
            <CreditCard className="w-5 h-5" />
            {i18n.language === 'ar' ? 'ترقية الخطة' : 'Upgrade Plan'}
          </Button>

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
