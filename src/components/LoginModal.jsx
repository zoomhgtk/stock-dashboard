'use client';

import { useState } from 'react';

export default function LoginModal({ onLogin }) {
  const [step, setStep] = useState('initial'); // initial, sent, verifying
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/request-otp', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStep('sent');
      } else {
        setError('请求失败，请重试');
      }
    } catch {
      setError('网络错误');
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('请输入6位验证码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.token, data.user);
      } else {
        setError(data.error || '验证码错误');
      }
    } catch {
      setError('网络错误');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[380px] p-8 mx-4">
        {/* Apple logo area */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#007aff] flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-center text-[#1d1d1f] mb-2">
          A股 Stock Dashboard
        </h2>
        <p className="text-sm text-[#86868b] text-center mb-6">
          个人持仓看板 — 安全验证
        </p>

        {step === 'initial' && (
          <button
            onClick={handleRequestOTP}
            disabled={loading}
            className="w-full py-3 px-6 bg-[#007aff] text-white rounded-xl font-medium
                       hover:bg-[#0066d6] disabled:opacity-50 transition-all duration-200
                       active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                发送中...
              </span>
            ) : (
              '获取验证码'
            )}
          </button>
        )}

        {step === 'sent' && (
          <div>
            <p className="text-xs text-[#86868b] text-center mb-4">
              点击后告知 AI 助理「已点击获取验证码」，助理会通过飞书对话将验证码发给你
            </p>
            <div className="flex gap-2 mb-4">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  value={code[i] || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val) {
                      const newCode = code.split('');
                      newCode[i] = val;
                      setCode(newCode.join(''));
                      // Auto-focus next
                      const next = document.getElementById(`otp-${i + 1}`);
                      if (next) next.focus();
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !code[i] && i > 0) {
                      const prev = document.getElementById(`otp-${i - 1}`);
                      if (prev) prev.focus();
                    }
                  }}
                  id={`otp-${i}`}
                  className="w-11 h-12 text-center text-lg font-semibold border border-[#d2d2d7] rounded-lg
                             focus:border-[#007aff] focus:ring-1 focus:ring-[#007aff] outline-none"
                  inputMode="numeric"
                  autoFocus={i === 0}
                />
              ))}
            </div>
            {error && <p className="text-xs text-[#e53935] text-center mb-3">{error}</p>}
            <button
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              className="w-full py-3 px-6 bg-[#007aff] text-white rounded-xl font-medium
                         hover:bg-[#0066d6] disabled:opacity-50 transition-all duration-200
                         active:scale-[0.98]"
            >
              {loading ? '验证中...' : '确认登录'}
            </button>
            <button
              onClick={() => { setStep('initial'); setCode(''); setError(''); }}
              className="w-full mt-2 py-2 text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors"
            >
              重新获取
            </button>
          </div>
        )}

        <p className="text-xs text-[#c7c7cc] text-center mt-4">
          OTP 由 AI 助理通过飞书发送，5分钟内有效
        </p>
      </div>
    </div>
  );
}
