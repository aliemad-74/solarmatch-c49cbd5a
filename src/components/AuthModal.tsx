import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { Loader2, Sun, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { z } from 'zod';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().regex(/^[0-9+\-\(\) ]{7,20}$/, 'Invalid phone number').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export default function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const { t, i18n } = useTranslation();
  const { signInWithEmail, signUpWithEmail, signInWithOAuth } = useUserAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<'google' | 'apple' | null>(null);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signup');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setError(null);
    setIsOAuthLoading(provider);
    
    const { error } = await signInWithOAuth(provider);
    
    if (error) {
      setError(error);
      setIsOAuthLoading(null);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    
    const result = signUpSchema.safeParse(signUpData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await signUpWithEmail(
      signUpData.email, 
      signUpData.password, 
      signUpData.name,
      signUpData.phone || undefined
    );
    
    if (error) {
      setError(error);
    } else {
      setSuccess(t('auth.checkEmail'));
    }
    
    setIsSubmitting(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    
    const result = signInSchema.safeParse(signInData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await signInWithEmail(signInData.email, signInData.password);
    
    if (error) {
      setError(error);
    } else {
      onSuccess();
      onOpenChange(false);
    }
    
    setIsSubmitting(false);
  };

  const isRTL = i18n.language === 'ar';
  const isDisabled = isSubmitting || isOAuthLoading !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-solar-gold/20 flex items-center justify-center">
            <Sun className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-display">
            {t('auth.title')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t('auth.description')}
          </DialogDescription>
        </DialogHeader>

        {/* Error/Success Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary text-sm">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-3 mt-4">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-3"
            onClick={() => handleOAuthSignIn('google')}
            disabled={isDisabled}
          >
            {isOAuthLoading === 'google' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {t('auth.continueWithGoogle')}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-3"
            onClick={() => handleOAuthSignIn('apple')}
            disabled={isDisabled}
          >
            {isOAuthLoading === 'apple' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            )}
            {t('auth.continueWithApple')}
          </Button>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t('auth.orContinueWith')}
            </span>
          </div>
        </div>

        {/* Email/Password Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
            <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
          </TabsList>

          <TabsContent value="signup" className="space-y-4 mt-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">{t('auth.name')}</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder={t('auth.namePlaceholder')}
                  value={signUpData.name}
                  onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                  className={fieldErrors.name ? 'border-destructive' : ''}
                  disabled={isDisabled}
                />
                {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">{t('auth.email')}</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={signUpData.email}
                  onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                  className={fieldErrors.email ? 'border-destructive' : ''}
                  disabled={isDisabled}
                  dir="ltr"
                />
                {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-phone">{t('auth.phone')} <span className="text-muted-foreground">({t('auth.optional')})</span></Label>
                <Input
                  id="signup-phone"
                  type="tel"
                  placeholder={t('auth.phonePlaceholder')}
                  value={signUpData.phone}
                  onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                  className={fieldErrors.phone ? 'border-destructive' : ''}
                  disabled={isDisabled}
                  dir="ltr"
                />
                {fieldErrors.phone && <p className="text-sm text-destructive">{fieldErrors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">{t('auth.password')}</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={signUpData.password}
                  onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                  className={fieldErrors.password ? 'border-destructive' : ''}
                  disabled={isDisabled}
                />
                {fieldErrors.password && <p className="text-sm text-destructive">{fieldErrors.password}</p>}
              </div>

              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <Shield className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <p>{t('auth.privacyNote')}</p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-solar-gold hover:opacity-90"
                disabled={isDisabled}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t('auth.creatingAccount')}
                  </>
                ) : (
                  t('auth.createAccount')
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signin" className="space-y-4 mt-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">{t('auth.email')}</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={signInData.email}
                  onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                  className={fieldErrors.email ? 'border-destructive' : ''}
                  disabled={isDisabled}
                  dir="ltr"
                />
                {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password">{t('auth.password')}</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  value={signInData.password}
                  onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                  className={fieldErrors.password ? 'border-destructive' : ''}
                  disabled={isDisabled}
                />
                {fieldErrors.password && <p className="text-sm text-destructive">{fieldErrors.password}</p>}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isDisabled}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t('auth.signingIn')}
                  </>
                ) : (
                  t('auth.signIn')
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
