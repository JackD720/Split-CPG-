import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Scissors, 
  Camera, 
  Home, 
  Store, 
  ArrowRight, 
  Check,
  Users,
  CreditCard,
  Calendar,
  Mail,
  Lock,
  User,
  AlertCircle
} from 'lucide-react';

const splitTypes = [
  {
    icon: Camera,
    title: 'Content',
    description: 'Split photographer, videographer, and studio costs',
    color: 'bg-blue-500'
  },
  {
    icon: Home,
    title: 'Housing',
    description: 'Share Airbnb and hotel costs for trade shows',
    color: 'bg-purple-500'
  },
  {
    icon: Store,
    title: 'Popups',
    description: 'Split retail popup and booth space',
    color: 'bg-green-500'
  }
];

const features = [
  {
    icon: Users,
    title: 'Open Discovery',
    description: 'Find other CPG brands looking to share costs'
  },
  {
    icon: CreditCard,
    title: 'Easy Payments',
    description: 'Stripe-powered splits with automatic distribution'
  },
  {
    icon: Calendar,
    title: 'Event Feed',
    description: 'Stay updated on trade shows and networking events'
  }
];

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup, login, loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name) {
          setError('Please enter your name');
          setLoading(false);
          return;
        }
        await signup(email, password, name);
      }
      navigate('/onboarding');
    } catch (err) {
      console.error('Auth error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use. Try logging in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/onboarding');
    } catch (err) {
      console.error('Google auth error:', err);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-split-200 rounded-full blur-3xl opacity-40" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-forest-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-40 right-1/4 w-72 h-72 bg-split-300 rounded-full blur-3xl opacity-30" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-split-500 rounded-xl flex items-center justify-center">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-2xl text-charcoal-900">Split</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowAuth(true); setIsLogin(true); }}
            className="btn-ghost"
          >
            Log in
          </button>
          <button
            onClick={() => { setShowAuth(true); setIsLogin(false); }}
            className="btn-primary"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-16 pb-24 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-charcoal-900 mb-6 animate-fade-in">
            Share costs,{' '}
            <span className="italic text-split-500">grow together</span>
          </h1>
          
          <p className="text-xl text-charcoal-600 max-w-2xl mx-auto mb-10 animate-fade-in animate-stagger-1">
            The platform for CPG brands to split content, housing, and popup costs.
            Find collaborators, manage payments, and scale smarter.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 animate-fade-in animate-stagger-2">
            <button
              onClick={() => { setShowAuth(true); setIsLogin(false); }}
              className="btn-primary text-lg px-8 py-4"
            >
              Start Splitting
              <ArrowRight className="w-5 h-5" />
            </button>
            <a href="#how-it-works" className="btn-secondary text-lg px-8 py-4">
              Learn More
            </a>
          </div>
        </div>

        {/* Split Types Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 animate-fade-in animate-stagger-3">
          {splitTypes.map((type, index) => (
            <div
              key={type.title}
              className="card p-6 hover:-translate-y-1 transition-transform duration-300"
              style={{ animationDelay: `${0.3 + index * 0.1}s` }}
            >
              <div className={`w-12 h-12 ${type.color} rounded-xl flex items-center justify-center mb-4`}>
                <type.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display text-xl text-charcoal-900 mb-2">
                {type.title}
              </h3>
              <p className="text-charcoal-600">
                {type.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 bg-white py-24">
        <div className="px-6 max-w-7xl mx-auto">
          <h2 className="font-display text-4xl text-center text-charcoal-900 mb-4">
            How it works
          </h2>
          <p className="text-charcoal-600 text-center max-w-2xl mx-auto mb-16">
            Get started in minutes and start saving on your next project
          </p>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Create profile', desc: 'Set up your brand in 30 seconds' },
              { step: 2, title: 'Post or browse', desc: 'Create a split or find one to join' },
              { step: 3, title: 'Connect', desc: 'Other brands join your split' },
              { step: 4, title: 'Pay & go', desc: 'Stripe handles the payments automatically' }
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 bg-split-100 text-split-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  {step}
                </div>
                <h3 className="font-display text-lg text-charcoal-900 mb-2">{title}</h3>
                <p className="text-charcoal-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-24 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-display text-4xl text-charcoal-900 mb-6">
              Built for emerging brands
            </h2>
            <p className="text-charcoal-600 mb-8">
              We know the hustle. Split is designed specifically for CPG founders
              who want to maximize impact while managing tight budgets.
            </p>
            
            <div className="space-y-4">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <div className="w-10 h-10 bg-forest-100 text-forest-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-charcoal-900">{feature.title}</h3>
                    <p className="text-charcoal-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Visual Element */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-split-200 to-forest-200 rounded-3xl blur-2xl opacity-50" />
            <div className="relative bg-white rounded-3xl shadow-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Camera className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-charcoal-900">Expo West Photo Day</h4>
                  <p className="text-sm text-charcoal-500">Content Split</p>
                </div>
                <span className="badge badge-open ml-auto">Open</span>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal-600">Total Cost</span>
                  <span className="font-medium">$1,200</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal-600">Slots</span>
                  <span className="font-medium">3 of 4 filled</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal-600">Your Cost</span>
                  <span className="font-semibold text-split-600">$300</span>
                </div>
              </div>
              
              <div className="h-2 bg-charcoal-100 rounded-full mb-6">
                <div className="h-2 bg-split-500 rounded-full w-3/4 transition-all duration-500" />
              </div>
              
              <div className="flex -space-x-2">
                {['bg-purple-400', 'bg-blue-400', 'bg-green-400'].map((color, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 ${color} rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                <div className="w-8 h-8 bg-charcoal-200 rounded-full border-2 border-white flex items-center justify-center text-charcoal-600 text-xs">
                  +1
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 bg-charcoal-900 py-20">
        <div className="px-6 max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl text-white mb-4">
            Ready to start splitting?
          </h2>
          <p className="text-charcoal-400 mb-8">
            Join the community of CPG founders saving money together
          </p>
          <button
            onClick={() => { setShowAuth(true); setIsLogin(false); }}
            className="btn-primary text-lg px-8 py-4"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-cream-100 py-8">
        <div className="px-6 max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-split-500 rounded-lg flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg text-charcoal-900">Split</span>
          </div>
          <p className="text-sm text-charcoal-500">
            © 2025 Split. Built for CPG founders.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-charcoal-900/60 backdrop-blur-sm"
            onClick={() => setShowAuth(false)}
          />
          
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 text-charcoal-400 hover:text-charcoal-600"
            >
              ✕
            </button>
            
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-split-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Scissors className="w-7 h-7 text-white" />
              </div>
              <h2 className="font-display text-2xl text-charcoal-900">
                {isLogin ? 'Welcome back' : 'Get started with Split'}
              </h2>
              <p className="text-charcoal-600 mt-1">
                {isLogin ? 'Log in to your account' : 'Create your account in seconds'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="label">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
                    <input
                      type="text"
                      className="input pl-10"
                      placeholder="Jane Founder"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
                  <input
                    type="email"
                    className="input pl-10"
                    placeholder="jane@yourbrand.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
                  <input
                    type="password"
                    className="input pl-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-6"
              >
                {loading ? 'Please wait...' : (isLogin ? 'Log in' : 'Create Account')}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-charcoal-200" />
              <span className="text-sm text-charcoal-400">or</span>
              <div className="flex-1 h-px bg-charcoal-200" />
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="btn-secondary w-full"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            
            {/* Toggle Login/Signup */}
            <p className="text-sm text-charcoal-500 text-center mt-6">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-split-600 font-medium hover:text-split-700"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
