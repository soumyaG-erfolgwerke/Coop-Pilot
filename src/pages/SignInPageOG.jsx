"use client";
import React, { useState, useEffect } from 'react';
import { User, LogIn, PlusCircle, X, Mail, Lock, Eye, EyeOff, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// --- Forgot Password Modal Component ---
const LinkForgotPasswordModal = ({ isOpen, onClose, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setEmail('');
    setError('');
    setSuccessMessage('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email) {
      setError('Email address is required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    onSubmit({ email });
    setSuccessMessage(`If an account exists for ${email}, a password reset link has been sent.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md animate-scaleUp">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Forgot Password</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700">
            <X size={22} />
          </button>
        </div>

        {!successMessage ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please enter your email address. We will send a password reset link.
            </p>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border rounded-md shadow-sm bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
              />
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button type="submit" className="w-full flex items-center justify-center px-6 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700">
              <Send className="h-5 w-5 mr-2" /> Send Reset Link
            </button>
          </form>
        ) : (
          <div className="text-center">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <p className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">Request Sent!</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{successMessage}</p>
            <button onClick={onClose} className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Login Modal Component ---
const LoginModal = ({ isOpen, onClose, onSubmit, onForgotPasswordClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail('');
    setPassword('');
    setError('');
    setShowPassword(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    onSubmit({ email, password });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md animate-scaleUp">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Sign In</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border rounded-md shadow-sm bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 border rounded-md shadow-sm bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <div className="flex items-center justify-between">
            <button type="button" onClick={onForgotPasswordClick} className="text-sm text-blue-600 hover:underline">
              Forgot your password?
            </button>
          </div>

          <button type="submit" className="w-full flex items-center justify-center px-6 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700">
            <LogIn className="h-5 w-5 mr-2" /> Sign in
          </button>
        </form>
      </div>
    </div>
  );
};

// --- SigninPage ---
const SigninPage = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleActualLogin = ({ email, password }) => {
    const loginPromise = login(email, password, router);

    toast.promise(loginPromise, {
      loading: 'Logging in...',
      success: () => {
        setIsLoginModalOpen(false);
        router.push('/dashboard');
        return 'Successfully logged in!';
      },
      error: (err) => err.message || 'Login failed. Please check your credentials.',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-inter">
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl text-center">
        <button className="mb-4 px-4 py-1.5 text-sm font-medium text-blue-700 bg-tint rounded-full cursor-default">
          Choose an option
        </button>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
          Digital tools for modern cooperatives
        </h2>
        <p className="mt-3 text-md sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          Stay compliant with European regulations for cooperatives.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sign In Option */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col items-center text-center">
          <div className="p-3 bg-tint dark:bg-primary-dark-900 rounded-full mb-4">
            <User className="h-8 w-8 text-blue-600 dark:text-primary/80" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Sign In</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Access your cooperative account and manage your participation.</p>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center justify-center px-6 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700"
          >
            <LogIn className="h-5 w-5 mr-2" /> Sign in
          </button>
        </div>

        {/* Add Cooperative Option */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col items-center text-center">
          <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <PlusCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Add Cooperative</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Register a new cooperative to start managing members and operations.</p>
          <button
            onClick={() => navigate('/add-coop')}
            className="flex items-center justify-center px-6 py-3 rounded-lg text-white bg-green-600 hover:bg-green-700"
          >
            <PlusCircle className="h-5 w-5 mr-2" /> Add Cooperative
          </button>
        </div>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSubmit={handleActualLogin}
        onForgotPasswordClick={() => {
          setIsLoginModalOpen(false);
          setIsForgotPasswordModalOpen(true);
        }}
      />

      <LinkForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
        onSubmit={() => {}}
      />
    </div>
  );
};

export default SigninPage;