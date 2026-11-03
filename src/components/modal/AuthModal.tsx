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

  // Signup fields
  const [signupPhone, setSignupPhone] = useState('+998');
  const [signupPassword, setSignupPassword] = useState('');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-brand-500/20">
            V
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {tab === 'signin'
              ? 'Tizimga kirish'
              : isWaitingTelegram
              ? 'Telegram tasdiqlash'
              : isVerifyingOtp
              ? 'Kodni tasdiqlang'
              : 'Akkaunt yaratish'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Visual platformasida g‘oyalaringizni kashf qiling va ulashing
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tabs */}
        {!isVerifyingOtp && !isWaitingTelegram && (
          <div className="flex bg-gray-100 p-1 rounded-full mb-6">
            <button
              type="button"
              onClick={() => {
                setTab('signin');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
                tab === 'signin'
                  ? 'bg-white text-gray-950 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
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
                  ? 'bg-white text-gray-950 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
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
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Username yoki telefon
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={signinUsername}
                  onChange={(e) => setSigninUsername(e.target.value)}
                  placeholder="masalan: azizbek"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Parol
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={signinPassword}
                  onChange={(e) => setSigninPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Kirilmoqda...' : 'Kirish'}
            </button>
          </form>
        )}

        {/* Sign Up Form - Step 1: Input details */}
        {tab === 'signup' && !isWaitingTelegram && !isVerifyingOtp && (
          <form onSubmit={handleSignupRequest} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Telefon raqam
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  placeholder="+998901234567"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  placeholder="username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Ism va familiya
              </label>
              <input
                type="text"
                value={signupFullName}
                onChange={(e) => setSignupFullName(e.target.value)}
                placeholder="Azizbek Oralov"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Parol
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Kamida 6 ta belgi"
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isLoading ? 'Yuborilmoqda...' : 'Davom etish (Telegram OTP)'}</span>
            </button>
          </form>
        )}

        {/* Sign Up Form - Step 2: Waiting Telegram Bot Start */}
        {tab === 'signup' && isWaitingTelegram && telegramData && (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#229ED9] text-white flex items-center justify-center mb-2 shadow-md">
                <Send className="w-6 h-6 ml-0.5" />
              </div>
              <p className="text-xs font-semibold text-sky-950">
                Tasdiqlash kodi Telegram orqali yuboriladi
              </p>
              <p className="text-[11px] text-sky-700 mt-1 max-w-xs">
                Quyidagi tugmani bosing va botda <b>Start</b> tugmasini bosing yoki telefoningiz bilan QR kodni skanerlang:
              </p>

              {/* QR Code */}
              <div className="mt-3 p-2 bg-white rounded-xl shadow-sm border border-sky-200 inline-block">
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
              className="w-full py-3 px-4 rounded-xl bg-[#229ED9] hover:bg-[#1e8ec3] active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Telegram botda ochish</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Polling Indicator */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 py-1">
              <Loader2 className="w-4 h-4 animate-spin text-[#229ED9]" />
              <span>Botda Start bosilishi kutilmoqda...</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsWaitingTelegram(false);
                setError(null);
              }}
              className="w-full text-xs text-gray-500 hover:text-gray-800 text-center font-medium flex items-center justify-center gap-1.5"
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
              <label className="block text-xs font-bold text-gray-700 mb-1 text-center">
                6 xonali tasdiqlash kodini kiriting
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full py-3 text-center tracking-[0.5em] text-2xl font-bold rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.length < 6}
              className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Tekshirilmoqda...' : 'Tasdiqlash va Kirish'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsVerifyingOtp(false);
                setIsWaitingTelegram(false);
                setError(null);
              }}
              className="w-full text-xs text-gray-500 hover:text-gray-800 text-center font-medium"
            >
              ← Boshiga qaytish
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
