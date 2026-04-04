import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Share2, Copy, Check, Link } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateShareUrl, copyToClipboard, ShareableParams } from "@/lib/shareUtils";
import { openWhatsAppChat } from "@/lib/externalLinks";

interface ShareDialogProps {
  params: ShareableParams;
  trigger?: React.ReactNode;
}

const ShareDialog = ({ params, trigger }: ShareDialogProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const shareUrl = generateShareUrl(params);

  const handleCopy = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            {t('results.shareResults')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5 text-primary" />
            {t('share.title')}
          </DialogTitle>
          <DialogDescription>
            {t('share.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 mt-4">
          <div className="grid flex-1 gap-2">
            <Input
              id="share-link"
              value={shareUrl}
              readOnly
              className="font-mono text-xs"
            />
          </div>
          <Button 
            type="button" 
            size="sm" 
            className="px-3 gap-2"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                {t('share.copied')}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                {t('share.copyLink')}
              </>
            )}
          </Button>
        </div>

        {/* Quick share buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              openWhatsAppChat('', `Check out my solar calculation: ${shareUrl}`);
            }}
          >
            WhatsApp
          </Button>
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              window.open(
                `mailto:?subject=${encodeURIComponent('My Solar Calculation')}&body=${encodeURIComponent(`Check out my solar feasibility report: ${shareUrl}`)}`,
                '_blank'
              );
            }}
          >
            Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
