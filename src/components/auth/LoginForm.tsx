import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/hooks/queries/useAuth';
import SwiftChatLogo from '@/components/shared/SwiftChatLogo';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const result = await loginMutation.mutateAsync({ email, password });
    if (result) navigate('/');
  };

  return (
    <div className='min-h-screen flex'>
      {/* Left panel — branding */}
      <div className='hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center'>
        {/* Animated gradient mesh background */}
        <div className='absolute inset-0 bg-[#0d0d0f]'>
          <motion.div
            animate={{
              background: [
                'radial-gradient(ellipse at 20% 30%, rgba(255,126,53,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(139,92,246,0.12) 0%, transparent 60%)',
                'radial-gradient(ellipse at 60% 20%, rgba(139,92,246,0.15) 0%, transparent 60%), radial-gradient(ellipse at 30% 80%, rgba(255,126,53,0.12) 0%, transparent 60%)',
                'radial-gradient(ellipse at 40% 60%, rgba(56,189,248,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(255,126,53,0.15) 0%, transparent 60%)',
                'radial-gradient(ellipse at 20% 30%, rgba(255,126,53,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(139,92,246,0.12) 0%, transparent 60%)',
              ],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className='absolute inset-0'
          />
          {/* Floating bolts */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -20, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 4 + i * 0.8,
                repeat: Infinity,
                delay: i * 0.6,
              }}
              className='absolute'
              style={{
                left: `${15 + i * 18}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
            >
              <Zap className='h-8 w-8 text-brand-orange/20 fill-brand-orange/10' />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className='relative z-10 text-center px-12'
        >
          <SwiftChatLogo size='lg' showText={false} className='justify-center mb-8' />
          <h1 className='font-display text-5xl font-bold gradient-text mb-4'>
            SwiftChat
          </h1>
          <p className='text-lg text-muted-foreground max-w-md mx-auto leading-relaxed'>
            Conversations at the speed of thought
          </p>
          <div className='mt-10 flex items-center justify-center gap-8 text-muted-foreground/60'>
            <div className='text-center'>
              <div className='text-2xl font-display font-bold gradient-text'>∞</div>
              <div className='text-xs mt-1'>Messages</div>
            </div>
            <div className='h-8 w-px bg-border' />
            <div className='text-center'>
              <div className='text-2xl font-display font-bold gradient-text'>E2E</div>
              <div className='text-xs mt-1'>Encrypted</div>
            </div>
            <div className='h-8 w-px bg-border' />
            <div className='text-center'>
              <div className='text-2xl font-display font-bold gradient-text'>HD</div>
              <div className='text-xs mt-1'>Video Calls</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className='flex-1 flex items-center justify-center p-6 bg-background'>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className='w-full max-w-md'
        >
          {/* Mobile logo */}
          <div className='lg:hidden mb-8 flex justify-center'>
            <SwiftChatLogo size='lg' />
          </div>

          <div className='space-y-2 mb-8'>
            <h2 className='font-display text-3xl font-bold tracking-tight'>Welcome back</h2>
            <p className='text-muted-foreground'>Sign in to continue to SwiftChat</p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-5'>
            <div className='space-y-2'>
              <Label htmlFor='login-email' className='text-muted-foreground text-sm font-medium'>
                Email address
              </Label>
              <div className='relative'>
                <Mail className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  id='login-email'
                  type='email'
                  placeholder='you@example.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='pl-11 h-12 bg-secondary border-border/50 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all'
                  required
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='login-password' className='text-muted-foreground text-sm font-medium'>
                Password
              </Label>
              <div className='relative'>
                <Lock className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  id='login-password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='pl-11 pr-11 h-12 bg-secondary border-border/50 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button
                type='submit'
                disabled={loginMutation.isPending}
                className='w-full h-12 rounded-xl gradient-glow text-white font-semibold text-sm tracking-wide hover:shadow-lg hover:shadow-brand-orange/25 transition-shadow'
              >
                {loginMutation.isPending ? (
                  <Loader2 className='h-5 w-5 animate-spin' />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          <p className='text-center text-sm text-muted-foreground mt-8'>
            Don't have an account?{' '}
            <Link to='/register' className='text-primary hover:underline font-semibold'>
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
