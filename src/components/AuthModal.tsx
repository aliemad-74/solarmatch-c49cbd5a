import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { Loader2, Sun, Shield, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

// Get client IP
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}
interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().regex(/^[0-9+\-\(\) ]{7,20}$/, 'Invalid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  userType: z.enum(['individual', 'business']),
  profileType: z.enum(['standard', 'technical']),
  agreedToTerms: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms' }) })
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
  const [oauthPhoneStep, setOauthPhoneStep] = useState<'google' | 'apple' | null>(null);
  const [oauthPhone, setOauthPhone] = useState('');
  const [oauthPhoneError, setOauthPhoneError] = useState<string | null>(null);
  
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    userType: 'individual' as 'individual' | 'business',
    profileType: 'standard' as 'standard' | 'technical',
    agreedToTerms: false,
  });

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  // Email sent success state
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setError(null);
    setIsOAuthLoading(provider);
    
    const { error } = await signInWithOAuth(provider);
    
    if (error) {
      setError(error);
    } else {
      // OAuth succeeded inline (no redirect) — close modal
      onSuccess();
      onOpenChange(false);
    }
    setIsOAuthLoading(null);
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
    
    try {
      // Get client IP
      const ip = await getClientIP();
      
      // Check if registration is allowed
      const { data: checkResult, error: checkError } = await supabase.rpc(
        'check_registration_allowed',
        { p_ip_address: ip, p_email: signUpData.email }
      );
      
      if (checkError) {
        console.error('Error checking registration:', checkError);
      } else if (checkResult) {
        const result = checkResult as { allowed: boolean; reason?: string; message?: string };
        if (!result.allowed) {
          setError(t(`auth.errors.${result.reason}`) || result.message || t('auth.errors.unknown'));
          setIsSubmitting(false);
          return;
        }
      }
      
      const { error } = await signUpWithEmail(
        signUpData.email, 
        signUpData.password, 
        signUpData.name,
        signUpData.phone,
        signUpData.userType,
        signUpData.profileType,
        signUpData.agreedToTerms
      );
      
      if (error) {
        setError(error);
      } else {
        // Show email sent confirmation
        setSentToEmail(signUpData.email);
        setEmailSent(true);
        setSuccess(t('auth.checkEmail'));
        try {
          const { trackEvent } = await import('@/lib/analytics');
          trackEvent('signup_completed', {
            method: 'email',
            user_type: signUpData.userType,
            profile_type: signUpData.profileType,
          });
        } catch {/* noop */}
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError(t('auth.errors.unknown'));
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

  const handleResendEmail = async () => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: sentToEmail
      });
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess(t('auth.emailResent'));
      }
    } catch (err) {
      setError(t('auth.errors.unknown'));
    }
    
    setIsSubmitting(false);
  };

  const handleBackFromEmailSent = () => {
    setEmailSent(false);
    setSentToEmail('');
    setError(null);
    setSuccess(null);
  };

  const isRTL = i18n.language === 'ar';
  const isDisabled = isSubmitting || isOAuthLoading !== null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setIsOAuthLoading(null);
        setIsSubmitting(false);
        setError(null);
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-solar-gold/20 flex items-center justify-center">
            {emailSent ? <Mail className="w-6 h-6 text-primary" /> : <Sun className="w-6 h-6 text-primary" />}
          </div>
          <DialogTitle className="text-lg font-display">
            {emailSent ? t('auth.emailSentTitle') : t('auth.title')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {emailSent ? (
              <>
                {t('auth.emailSentDescription')} <span className="font-medium text-foreground" dir="ltr">{sentToEmail}</span>
              </>
            ) : (
              t('auth.description')
            )}
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

        {/* Email Sent Confirmation Screen */}
        {emailSent ? (
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {t('auth.checkEmailInstructions')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('auth.checkSpam')}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResendEmail}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-2" />
                ) : null}
                {t('auth.resendEmail')}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBackFromEmailSent}
                className="w-full"
              >
                {t('auth.backToSignup')}
              </Button>
            </div>
          </div>
        ) : (
          <>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => handleOAuthSignIn('google')}
            disabled={isDisabled}
          >
            {isOAuthLoading === 'google' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Google
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => handleOAuthSignIn('apple')}
            disabled={isDisabled}
          >
            {isOAuthLoading === 'apple' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            )}
            Apple
          </Button>
        </div>

        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground text-[10px]">
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

          <TabsContent value="signup" className="space-y-3 mt-3">
            <form onSubmit={handleSignUp} className="space-y-3">
              {/* Profile Type Selection */}
              <div className="space-y-2">
                <Label className="text-sm">{isRTL ? "نوع الحساب" : "Profile Type"}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignUpData({ ...signUpData, profileType: 'standard' })}
                    disabled={isDisabled}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      signUpData.profileType === 'standard'
                        ? 'bg-primary/10 border-solar-gold ring-2 ring-solar-gold/50'
                        : 'bg-muted/30 border-border/50 hover:border-primary/50'
                    }`}
                  >
                    <span className="text-2xl block mb-1">🏠</span>
                    <p className="font-medium text-xs">{isRTL ? "صاحب عقار أو مشروع" : "Property / Project Owner"}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{isRTL ? "أبحث عن تركيب طاقة شمسية" : "Looking for solar installation"}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignUpData({ ...signUpData, profileType: 'technical' })}
                    disabled={isDisabled}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      signUpData.profileType === 'technical'
                        ? 'bg-primary/10 border-solar-gold ring-2 ring-solar-gold/50'
                        : 'bg-muted/30 border-border/50 hover:border-primary/50'
                    }`}
                  >
                    <span className="text-2xl block mb-1">⚙️</span>
                    <p className="font-medium text-xs">{isRTL ? "مهندس أو مقاول تركيب" : "Engineer / Installer"}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{isRTL ? "أعمل في مجال الطاقة الشمسية" : "Working in solar energy"}</p>
                  </button>
                </div>
              </div>

              {/* User Type Selection */}
              <div className="space-y-2">
                <Label className="text-sm">{t('auth.userType')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={signUpData.userType === 'individual' ? 'default' : 'outline'}
                    size="sm"
                    className={`h-9 ${signUpData.userType === 'individual' ? 'bg-primary' : ''}`}
                    onClick={() => setSignUpData({ ...signUpData, userType: 'individual' })}
                    disabled={isDisabled}
                  >
                    {t('auth.individual')}
                  </Button>
                  <Button
                    type="button"
                    variant={signUpData.userType === 'business' ? 'default' : 'outline'}
                    size="sm"
                    className={`h-9 ${signUpData.userType === 'business' ? 'bg-primary' : ''}`}
                    onClick={() => setSignUpData({ ...signUpData, userType: 'business' })}
                    disabled={isDisabled}
                  >
                    {t('auth.business')}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="signup-name" className="text-sm">{t('auth.name')}</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder={t('auth.namePlaceholder')}
                    value={signUpData.name}
                    onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                    className={`h-9 ${fieldErrors.name ? 'border-destructive' : ''}`}
                    disabled={isDisabled}
                  />
                  {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="signup-phone" className="text-sm">{t('auth.phone')}</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="+20..."
                    value={signUpData.phone}
                    onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                    className={`h-9 ${fieldErrors.phone ? 'border-destructive' : ''}`}
                    disabled={isDisabled}
                    dir="ltr"
                  />
                  {fieldErrors.phone && <p className="text-xs text-destructive">{fieldErrors.phone}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-email" className="text-sm">{t('auth.email')}</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={signUpData.email}
                  onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                  className={`h-9 ${fieldErrors.email ? 'border-destructive' : ''}`}
                  disabled={isDisabled}
                  dir="ltr"
                />
                {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-password" className="text-sm">{t('auth.password')}</Label>
                <PasswordInput
                  id="signup-password"
                  placeholder="••••••••"
                  value={signUpData.password}
                  onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                  className={`h-9 ${fieldErrors.password ? 'border-destructive' : ''}`}
                  disabled={isDisabled}
                />
                {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2">
                <Checkbox
                  id="agree-terms"
                  checked={signUpData.agreedToTerms}
                  onCheckedChange={(checked) => setSignUpData({ ...signUpData, agreedToTerms: checked === true })}
                  disabled={isDisabled}
                  className="mt-0.5"
                />
                <label htmlFor="agree-terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  {isRTL ? (
                    <>أوافق على <Link to="/privacy" onClick={() => onOpenChange(false)} className="text-primary hover:underline">سياسة الخصوصية</Link> وشروط الاستخدام</>
                  ) : (
                    <>I agree to the <Link to="/privacy" onClick={() => onOpenChange(false)} className="text-primary hover:underline">Privacy Policy</Link> and Terms of Use</>
                  )}
                </label>
              </div>
              {fieldErrors.agreedToTerms && <p className="text-xs text-destructive">{fieldErrors.agreedToTerms}</p>}

              <Button
                type="submit"
                size="sm"
                className="w-full bg-gradient-to-r from-primary to-solar-gold hover:opacity-90"
                disabled={isDisabled || !signUpData.agreedToTerms}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-2" />
                    {t('auth.creatingAccount')}
                  </>
                ) : (
                  t('auth.createAccount')
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signin" className="space-y-3 mt-3">
            <form onSubmit={handleSignIn} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="signin-email" className="text-sm">{t('auth.email')}</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={signInData.email}
                  onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                  className={`h-9 ${fieldErrors.email ? 'border-destructive' : ''}`}
                  disabled={isDisabled}
                  dir="ltr"
                />
                {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="signin-password" className="text-sm">{t('auth.password')}</Label>
                <PasswordInput
                  id="signin-password"
                  placeholder="••••••••"
                  value={signInData.password}
                  onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                  className={`h-9 ${fieldErrors.password ? 'border-destructive' : ''}`}
                  disabled={isDisabled}
                />
                {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
              </div>

              {/* Forgot Password Link */}
              <div className="text-center">
                <Link 
                  to="/forgot-password" 
                  onClick={() => onOpenChange(false)}
                  className="text-sm text-primary hover:underline"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              <Button
                type="submit"
                size="sm"
                className="w-full"
                disabled={isDisabled}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-2" />
                    {t('auth.signingIn')}
                  </>
                ) : (
                  t('auth.signIn')
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
