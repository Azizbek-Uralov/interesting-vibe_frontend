import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  Send,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';

export const AuthModal: React.FC = () => {
  const { authModalState, closeAuthModal, loginUser } = useAuth();
  const { isOpen, tab: initialTab } = authModalState;

  const [tab, setTab] = useState<'signin' | 'signup'>(initialTab);

  // Signin fields
  const [signinUsername, setSigninUsername] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [showSigninPassword, setShowSigninPassword] = useState(false);

  // Signup fields
  const [signupPhone, setSignupPhone] = useState('+998');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupUsername, setSignupUsername] = useState('');
  const [signupFullName, setSignupFullName] = useState('');

  // Telegram Step
  const [isWaitingTelegram, setIsWaitingTelegram] = useState(false);
  const [telegramData, setTelegramData] = useState<{
    sessionToken: string;
    botUrl: string;
    botUsername?: string;
  } | null>(null);

  // OTP Verification Step
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Telegram status polling
  useEffect(() => {
    let interval: any = null;

    if (isWaitingTelegram && telegramData?.sessionToken) {
      interval = setInterval(async () => {
        try {
          const res = await authApi.getTelegramStatus(telegramData.sessionToken);
          if (res.status === 'SENT') {
            clearInterval(interval);
            setIsWaitingTelegram(false);
            setIsVerifyingOtp(true);
            setSuccessMsg(
              'Tasdiqlash kodi Telegram botingizga yuborildi! Uni quyida kiriting.',
            );
          } else if (res.status === 'EXPIRED') {
            clearInterval(interval);
            setIsWaitingTelegram(false);
            setError(
              'Telegram sessiya muddati tugadi. Qaytadan urinib ko‘ring.',
            );
          }
        } catch {
          // ignore network hiccups
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWaitingTelegram, telegramData?.sessionToken]);

  if (!isOpen) return null;

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authApi.signin({
        username: signinUsername,
        password: signinPassword,
      });
      await loginUser();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Kirishda xatolik yuz berdi. Username yoki parolni tekshiring.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await authApi.signup({
        phone: signupPhone,
        password: signupPassword,
        username: signupUsername || undefined,
        fullName: signupFullName || undefined,
      });

      if (res?.provider === 'TELEGRAM' && res?.sessionToken) {
        setTelegramData({
          sessionToken: res.sessionToken,
          botUrl: res.botUrl,
          botUsername: res.botUsername,
        });
        setIsWaitingTelegram(true);
        setSuccessMsg('Telegram bot orqali tasdiqlash uchun Start tugmasini bosing.');
      } else {
        setIsVerifyingOtp(true);
        setSuccessMsg(`Tasdiqlash kodi ${signupPhone} raqamiga yuborildi.`);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Ro‘yxatdan o‘tishda xatolik yuz berdi.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authApi.verifySignup({
        phone: signupPhone,
        phoneNumber: signupPhone,
        code: otpCode.trim(),
      });
      await loginUser();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Tasdiqlash kodi noto‘g‘ri yoki muddati o‘tgan.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C221E]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FAF7F2] rounded-[28px] shadow-2xl p-6 sm:p-8 border border-[#E6DEC3] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-full text-[#8C7A6B] hover:text-[#2C221E] hover:bg-[#EFE7DD] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#8B5E3C] text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-[#8B5E3C]/20">
            <Sparkles className="w-6 h-6 fill-white/20 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#2C221E] tracking-tight">
            {tab === 'signin'
              ? 'Tizimga kirish'
              : isWaitingTelegram
              ? 'Telegram tasdiqlash'
              : isVerifyingOtp
              ? 'Kodni tasdiqlang'
              : 'Akkaunt yaratish'}
          </h2>
          <p className="text-xs text-[#8C7A6B] mt-1 font-medium">
            Interesting-Vibe platformasida g‘oyalaringizni kashf qiling
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-[14px] bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-xs text-[#C85A5A] font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#C85A5A]" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-[14px] bg-emerald-50 border border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tabs */}
        {!isVerifyingOtp && !isWaitingTelegram && (
          <div className="flex bg-[#EFE7DD] p-1 rounded-full mb-6">
            <button
              type="button"
              onClick={() => {
                setTab('signin');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
                tab === 'signin'
                  ? 'bg-white text-[#2C221E] shadow-sm'
                  : 'text-[#8C7A6B] hover:text-[#2C221E]'
              }`}
            >
              Kirish
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
                tab === 'signup'
                  ? 'bg-white text-[#2C221E] shadow-sm'
                  : 'text-[#8C7A6B] hover:text-[#2C221E]'
              }`}
            >
              Ro‘yxatdan o‘tish
            </button>
          </div>
        )}

        {/* Sign In Form */}
        {tab === 'signin' && (
          <form onSubmit={handleSignin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#2C221E] mb-1.5">
                Username yoki telefon
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={signinUsername}
                  onChange={(e) => setSigninUsername(e.target.value)}
                  placeholder="masalan: azizbek"
                  className="w-full pl-10 pr-4 py-2.5 rounded-[14px] bg-white border border-[#E6DEC3] text-sm text-[#2C221E] placeholder-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2C221E] mb-1.5">
                Parol
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-3" />
                <input
                  type={showSigninPassword ? 'text' : 'password'}
                  required
                  value={signinPassword}
                  onChange={(e) => setSigninPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-[14px] bg-white border border-[#E6DEC3] text-sm text-[#2C221E] placeholder-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowSigninPassword((prev) => !prev)}
                  className="absolute right-3.5 top-3 text-[#8C7A6B] hover:text-[#2C221E] focus:outline-none transition-colors"
                  title={showSigninPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
                >
                  {showSigninPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-full bg-[#8B5E3C] hover:bg-[#6E472B] active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-[#8B5E3C]/25 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Kirilmoqda...' : 'Kirish'}
            </button>
          </form>
        )}

        {/* Sign Up Form - Step 1: Input details */}
        {tab === 'signup' && !isWaitingTelegram && !isVerifyingOtp && (
          <form onSubmit={handleSignupRequest} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-[#2C221E] mb-1">
                Telefon raqam
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  placeholder="+998901234567"
                  className="w-full pl-10 pr-4 py-2.5 rounded-[14px] bg-white border border-[#E6DEC3] text-sm text-[#2C221E] placeholder-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2C221E] mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  placeholder="username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-[14px] bg-white border border-[#E6DEC3] text-sm text-[#2C221E] placeholder-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2C221E] mb-1">
                Ism va familiya
              </label>
              <input
                type="text"
                value={signupFullName}
                onChange={(e) => setSignupFullName(e.target.value)}
                placeholder="Azizbek Oralov"
                className="w-full px-4 py-2.5 rounded-[14px] bg-white border border-[#E6DEC3] text-sm text-[#2C221E] placeholder-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2C221E] mb-1">
                Parol
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-3" />
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Kamida 6 ta belgi"
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 rounded-[14px] bg-white border border-[#E6DEC3] text-sm text-[#2C221E] placeholder-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword((prev) => !prev)}
                  className="absolute right-3.5 top-3 text-[#8C7A6B] hover:text-[#2C221E] focus:outline-none transition-colors"
                  title={showSignupPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
                >
                  {showSignupPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-full bg-[#8B5E3C] hover:bg-[#6E472B] active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-[#8B5E3C]/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isLoading ? 'Yuborilmoqda...' : 'Davom etish (Telegram OTP)'}</span>
            </button>
          </form>
        )}

        {/* Sign Up Form - Step 2: Waiting Telegram Bot Start */}
        {tab === 'signup' && isWaitingTelegram && telegramData && (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-[18px] bg-[#EFE7DD]/80 border border-[#E6DEC3] flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#8B5E3C] text-white flex items-center justify-center mb-2 shadow-md">
                <Send className="w-6 h-6 ml-0.5" />
              </div>
              <p className="text-xs font-bold text-[#2C221E]">
                Tasdiqlash kodi Telegram bot orqali yuboriladi
              </p>
              <p className="text-[11px] text-[#8C7A6B] mt-1 max-w-xs leading-relaxed">
                Quyidagi tugmani bosing va botda <b>Start</b> tugmasini bosing yoki telefoningiz bilan QR kodni skanerlang:
              </p>

              {/* QR Code */}
              <div className="mt-3 p-2.5 bg-white rounded-[14px] shadow-sm border border-[#E6DEC3] inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    telegramData.botUrl,
                  )}`}
                  alt="Telegram Deep Link QR"
                  className="w-36 h-36 rounded-lg object-contain"
                />
              </div>
            </div>

            {/* Direct Open Button */}
            <a
              href={telegramData.botUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-full bg-[#8B5E3C] hover:bg-[#6E472B] active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-[#8B5E3C]/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Telegram botda ochish</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Polling Indicator */}
            <div className="flex items-center justify-center gap-2 text-xs text-[#8C7A6B] py-1 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-[#8B5E3C]" />
              <span>Botda Start bosilishi kutilmoqda...</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsWaitingTelegram(false);
                setError(null);
              }}
              className="w-full text-xs text-[#8C7A6B] hover:text-[#2C221E] text-center font-bold flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Raqamni o‘zgartirish</span>
            </button>
          </div>
        )}

        {/* Sign Up Form - Step 3: Enter OTP */}
        {tab === 'signup' && isVerifyingOtp && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#2C221E] mb-1 text-center">
                6 xonali tasdiqlash kodini kiriting
              </label>
              <p className="text-[11px] text-[#8C7A6B] text-center mb-2 font-medium">
                Telegram botingizga yuborilgan kodni kiriting
              </p>
              <input
                type="text"
                required
                maxLength={6}
                inputMode="numeric"
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full py-3 text-center tracking-[0.5em] text-2xl font-extrabold rounded-[14px] bg-white border-2 border-[#E6DEC3] text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.length < 6}
              className="w-full py-3 px-4 rounded-full bg-[#8B5E3C] hover:bg-[#6E472B] active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-[#8B5E3C]/25 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Tekshirilmoqda...' : 'Tasdiqlash va Kirish'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsVerifyingOtp(false);
                setIsWaitingTelegram(false);
                setOtpCode('');
                setError(null);
              }}
              className="w-full text-xs text-[#8C7A6B] hover:text-[#2C221E] text-center font-bold"
            >
              ← Boshiga qaytish
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
