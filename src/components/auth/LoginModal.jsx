'use client'

import React, { useState } from 'react'
import Modal from 'react-modal'
import { FaGoogle, FaEnvelope, FaUser, FaLock, FaImage, FaSpinner, FaApple } from 'react-icons/fa'
import { SiRoblox } from 'react-icons/si'
import { IoClose } from 'react-icons/io5'
import { auth, googleProvider, appleProvider } from '../../lib/firebase'
import { signInWithPopup } from 'firebase/auth'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BACKEND_URL } from '../../lib/api'

const customStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(5px)',
  },
  content: {
    top: 'auto',
    left: 'auto',
    right: 'auto',
    bottom: 'auto',
    border: 'none',
    background: 'none',
    padding: 0,
    maxWidth: '95%',
    width: '450px',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
}

const LoginModal = ({ isOpen, onRequestClose }) => {
  const { login } = useAuth();
  const router = useRouter();
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAppleDevice, setIsAppleDevice] = useState(false);

  React.useEffect(() => {
    // Check if device is Apple (Mac, iPhone, iPad, iPod)
    const checkAppleDevice = () => {
      if (typeof window === 'undefined') return false;
      const userAgent = window.navigator.userAgent.toLowerCase();
      // Check for 'mac' (macOS), 'iphone', 'ipad', 'ipod'
      // Note: modern iPads often report as Macintosh
      return /mac|iphone|ipad|ipod/.test(userAgent);
    };
    setIsAppleDevice(checkAppleDevice());
  }, []);
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '', 
  });
  const [avatarFile, setAvatarFile] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleSocialLogin = async (provider) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const response = await fetch(`${BACKEND_URL}/oauth/auth/firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.data.user);
        onRequestClose();
        router.push('/');
      } else {
        setError(data.message || "Social login failed");
      }
    } catch (error) {
      console.error("Social login failed", error);
      setError(error.message || "Social login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let url = isLoginView 
        ? `${BACKEND_URL}/api/v1/users/login` 
        : `${BACKEND_URL}/api/v1/users/register`;
      
      let body;
      let headers = {};

      if (isLoginView) {
        // Login Logic
        body = JSON.stringify({
            // Backend expects 'username' or 'email'. We allow user to input either in 'email' field.
            // But if we want to be precise, we can send both or detect.
            // Backend logic: const { email, username, password } = req.body; if (!username && !email)...
            // const user = await User.findOne({ $or: [{ username }, { email }] });
            // So we can just send the input as 'email' (or 'username') and it will work if we map it?
            // Actually, backend checks BOTH. So it's safe to send input as 'email' or 'username'.
            // Let's send it as 'username' or 'email' depending on input? 
            // Simplest: Send input as 'username' AND 'email' (same value) or just one field if backend handles it?
            // Backend: const { email, username, password } = req.body;
            // It uses: $or: [{ username }, { email }]
            // So we can pass { username: input, password } and it will find by username OR email if input matches either.
            // Backend: const { email, password } = req.body;
            // It uses: email
            // So we can pass { email: input, password }
            email: formData.email, 
            password: formData.password
        });
        headers['Content-Type'] = 'application/json';
      } else {
        // Register Logic - Multipart form data
        const data = new FormData();
        data.append('fullName', formData.fullName);
        data.append('email', formData.email);
        data.append('password', formData.password);
        if (avatarFile) {
          data.append('avatar', avatarFile); // Backend expects 'avatar' field for file
        }
        body = data;
        // Don't set Content-Type header for FormData, browser does it with boundary
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
      });

      const data = await response.json();

      if (response.ok) {
        if (!isLoginView) {
            // Auto login after register
            const loginRes = await fetch(`${BACKEND_URL}/api/v1/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, password: formData.password })
            });
            const loginData = await loginRes.json();
             if (loginRes.ok) {
                 login(loginData.data.user);
                 setFormData({ fullName: '', email: '', password: '' });
                 setAvatarFile(null);
                 onRequestClose();
                 router.push('/');
             } else {
                 setIsLoginView(true);
                 setError("Registration successful! Please log in.");
             }
        } else {
            login(data.data.user || data.data); // Login returns {user, tokens}, Register returns user
            setFormData({ fullName: '', email: '', password: '' });
            setAvatarFile(null);
            onRequestClose();
            router.push('/');
        }
      } else {
        setError(data.message || "Authentication failed");
      }
    } catch (error) {
       console.error("Auth failed", error);
       setError(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={customStyles}
      contentLabel="Login Modal"
      ariaHideApp={false}
    >
      <div className="relative w-full overflow-hidden rounded-2xl bg-white p-8 shadow-2xl dark:bg-[#1a1a1a] flex flex-col max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={onRequestClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-active/20 transition-colors z-10"
        >
          <IoClose size={24} />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white font-plus-jakarta">
            {isLoginView ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
             {isLoginView ? "Sign in to continue to Roblox Skin" : "Join us to start creating skins"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-gray-100 dark:bg-[#2a2a2a] rounded-xl p-1">
            <button 
                onClick={() => setIsLoginView(true)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${isLoginView ? 'bg-white text-black shadow-sm dark:bg-[#333] dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
                Sign In
            </button>
            <button 
                onClick={() => setIsLoginView(false)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!isLoginView ? 'bg-white text-black shadow-sm dark:bg-[#333] dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
                Register
            </button>
        </div>

        {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-500 text-sm dark:bg-red-500/10 dark:text-red-400">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-1 py-1">
            
            {!isLoginView && (
                <>
                     <div className="relative group">
                        <FaUser className="absolute top-3.5 left-4 text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                        <input 
                            type="text" 
                            name="fullName"
                            placeholder="Full Name"
                            required
                            value={formData.fullName}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-black focus:bg-white dark:border-gray-700 dark:bg-[#2a2a2a] dark:text-white dark:focus:border-white dark:focus:bg-[#333]"
                        />
                    </div>

                     <div className="flex items-center gap-4">
                        <div className="relative flex-1 group">
                             <label htmlFor="avatar-upload" className="cursor-pointer flex items-center gap-2 w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-sm outline-none transition-all hover:bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-[#2a2a2a] dark:text-white dark:hover:bg-[#333]">
                                <FaImage className="text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                <span className="text-gray-500 dark:text-gray-400 truncate">
                                    {avatarFile ? avatarFile.name : "Upload Profile Image"}
                                </span>
                                <input 
                                    id="avatar-upload"
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                             </label>
                        </div>
                     </div>
                </>
            )}

            <div className="relative group">
                <FaEnvelope className="absolute top-3.5 left-4 text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                <input 
                    type={isLoginView ? "text" : "email"}
                    name="email"
                    placeholder={isLoginView ? "Email Address" : "Email Address"}
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-black focus:bg-white dark:border-gray-700 dark:bg-[#2a2a2a] dark:text-white dark:focus:border-white dark:focus:bg-[#333]"
                />
            </div>

            <div className="relative group">
                <FaLock className="absolute top-3.5 left-4 text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                <input 
                    type="password" 
                    name="password"
                    placeholder="Password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-black focus:bg-white dark:border-gray-700 dark:bg-[#2a2a2a] dark:text-white dark:focus:border-white dark:focus:bg-[#333]"
                />
            </div>

            <button 
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full rounded-xl bg-black py-3.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-lg active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
            >
                {isLoading ? <FaSpinner className="animate-spin text-lg" /> : (isLoginView ? "Sign In" : "Create Account")}
            </button>
        </form>

        <div className="mt-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
            <span className="text-xs font-medium text-gray-500 uppercase">Or continue with</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button 
            onClick={() => handleSocialLogin(googleProvider)}
            disabled={isLoading}
            className="group flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:shadow-md hover:border-gray-300 active:scale-[0.98] dark:border-gray-700 dark:bg-[#2a2a2a] dark:text-white dark:hover:bg-[#333] disabled:opacity-70">
            <FaGoogle className="text-xl text-[#DB4437]" />
            <span>Google</span>
          </button>

          <Link href={`${BACKEND_URL}/oauth/roblox/login`} className="group flex w-full items-center justify-center gap-3 rounded-xl bg-[#000000] px-4 py-3.5 font-semibold text-white transition-all hover:bg-[#1a1a1a] hover:shadow-md active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-gray-100">
            <SiRoblox className="text-xl" />
            <span>Roblox</span>
          </Link>

          {isAppleDevice && (
          <button 
            onClick={() => handleSocialLogin(appleProvider)}
            disabled={isLoading}
            className="group flex w-full items-center justify-center gap-3 rounded-xl bg-black px-4 py-3.5 font-semibold text-white transition-all hover:bg-gray-900 hover:shadow-md active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-gray-100 disabled:opacity-70">
            <FaApple className="text-xl" />
            <span>Apple</span>
          </button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          By continuing, you agree to our{' '}
          <a href="#" className="font-semibold text-black dark:text-white hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="font-semibold text-black dark:text-white hover:underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </Modal>
  )
}

export default LoginModal
