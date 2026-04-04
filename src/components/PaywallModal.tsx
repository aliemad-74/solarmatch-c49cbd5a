import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, MessageCircle, Crown, Building2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WHATSAPP_NUMBER = '+201111009619';

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PaywallModal({ open, onOpenChange }: PaywallModalProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  const handleWhatsApp = (plan: string) => {
    const message = encodeURIComponent(
      i18n.language === 'ar'
        ? `مرحباً، أريد الاشتراك في خطة ${plan} على SolarMatch`
        : `Hello, I want to subscribe to the ${plan} plan on SolarMatch`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-secondary" />
          </div>
          <DialogTitle className="text-xl font-display">
            {t('paywall.title')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t('paywall.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {/* Single Report */}
          <div
            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => handleWhatsApp('Single Report - 50 EGP')}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{t('paywall.singleReport')}</p>
              <p className="text-xs text-muted-foreground">{t('paywall.singleReportDesc')}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-primary">50 {t('pricing.currency')}</p>
            </div>
          </div>

          {/* Premium */}
          <div
            className="flex items-center gap-4 p-4 rounded-lg border-2 border-secondary/50 bg-secondary/5 hover:bg-secondary/10 transition-colors cursor-pointer"
            onClick={() => handleWhatsApp('Premium - 300 EGP/month')}
          >
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{t('paywall.premium')}</p>
              <p className="text-xs text-muted-foreground">{t('paywall.premiumDesc')}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-secondary">300 {t('pricing.currency')}<span className="text-xs font-normal">/{t('pricing.month')}</span></p>
            </div>
          </div>

          {/* Business */}
          <div
            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => handleWhatsApp('Business - 1000 EGP/month')}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{t('paywall.business')}</p>
              <p className="text-xs text-muted-foreground">{t('paywall.businessDesc')}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-primary">1000 {t('pricing.currency')}<span className="text-xs font-normal">/{t('pricing.month')}</span></p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); navigate('/pricing'); }}>
            {t('paywall.viewAllPlans')}
          </Button>
          <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{t('paywall.whatsappNote')}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
