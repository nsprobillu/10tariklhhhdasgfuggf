import React, { useState } from 'react';
import { 
  Mail, Lock, Eye, EyeOff, Shield, Clock, CheckCircle, Star, 
  Zap, Globe, Gift, Crown, Infinity, Bell, Ticket
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { BackButton } from '../components/BackButton';

export function Register() {
  const navigate = useNavigate();
  const register = useAuthStore(state => state.register);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    general: ''
  });

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: '',
      confirmPassword: '',
      general: ''
    };
    let isValid = true;

    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await register(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error: any) {
      setErrors(prev => ({
        ...prev,
        general: error.message || 'Registration failed. Please try again.'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4A90E2] to-[#357ABD]">
      <div className="absolute top-4 left-4 z-10">
        <BackButton />
      </div>

      {/* Free Service Banner */}
      <div className="bg-green-500 text-white py-2 px-4 text-center">
        <p className="text-sm font-medium">
          🎉 100% Free Forever - No Credit Card Required 🎉
        </p>
      </div>

      {/* Main Container */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center text-white mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Create Your Free Account Today
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Join 100,000+ users enjoying unlimited temporary emails with lifetime access. 
              No hidden fees, no premium plans - everything is completely free!
            </p>
          </div>

          {/* Main Content */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Form Section */}
            <div className="w-full md:w-1/2">
              <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
                {errors.general && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-600 flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      {errors.general}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`pl-10 w-full h-12 rounded-lg border ${
                          errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                        placeholder="your@email.com"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <Shield className="w-4 h-4 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`pl-10 w-full h-12 rounded-lg border ${
                          errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                        placeholder="Create password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <Shield className="w-4 h-4 mr-1" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className={`pl-10 w-full h-12 rounded-lg border ${
                          errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                        placeholder="Confirm password"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <Shield className="w-4 h-4 mr-1" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Promo Code Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Have a Promo Code? (Optional)
                    </label>
                    <div className="relative">
                      <Ticket className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        className="pl-10 w-full h-12 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter promo code"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-[#4A90E2] hover:bg-[#357ABD] text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Create Free Account'
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="text-[#4A90E2] hover:text-[#357ABD] font-medium"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>

              {/* Free Service Highlights */}
              <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
                <div className="flex items-center mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  <span className="text-sm">No credit card required</span>
                </div>
                <div className="flex items-center mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  <span className="text-sm">Free forever - no hidden charges</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  <span className="text-sm">Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="w-full md:w-1/2">
              {/* Why Register Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-white mb-6">
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <Crown className="w-6 h-6 mr-2 text-yellow-300" />
                  Everything Included Free Forever
                </h2>
                
                <div className="grid gap-6">
                  <div className="flex items-center bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors">
                    <Infinity className="w-8 h-8 text-yellow-300 mr-4" />
                    <div>
                      <h3 className="font-semibold">Unlimited Everything</h3>
                      <p className="text-sm text-white/80">Create unlimited email addresses with no restrictions</p>
                    </div>
                  </div>

                  <div className="flex items-center bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors">
                    <Globe className="w-8 h-8 text-yellow-300 mr-4" />
                    <div>
                      <h3 className="font-semibold">Unified Dashboard</h3>
                      <p className="text-sm text-white/80">Manage all your temporary emails in one place</p>
                    </div>
                  </div>

                  <div className="flex items-center bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors">
                    <Clock className="w-8 h-8 text-yellow-300 mr-4" />
                    <div>
                      <h3 className="font-semibold">Lifetime Access</h3>
                      <p className="text-sm text-white/80">Your emails never expire - keep them as long as you want</p>
                    </div>
                  </div>

                  <div className="flex items-center bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors">
                    <Bell className="w-8 h-8 text-yellow-300 mr-4" />
                    <div>
                      <h3 className="font-semibold">Premium Features Included</h3>
                      <p className="text-sm text-white/80">Get all premium features completely free</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Stats */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-white">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <div className="text-3xl font-bold text-yellow-300">100K+</div>
                    <div className="text-sm text-white/80">Active Users</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <div className="text-3xl font-bold text-yellow-300">1M+</div>
                    <div className="text-sm text-white/80">Emails Created</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}