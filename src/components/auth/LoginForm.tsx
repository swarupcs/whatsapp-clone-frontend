import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  MessageCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChatStore } from '@/store/chatStore';
import { toast } from 'sonner';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useChatStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='auth-container'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='auth-card'
      >
        {/* Logo */}
        <div className='flex flex-col items-center space-y-2'>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className='h-16 w-16 rounded-2xl gradient-glow flex items-center justify-center'
          >
            <MessageCircle className='h-8 w-8 text-white' />
          </motion.div>
          <h1 className='text-2xl font-bold tracking-tight'>Welcome back</h1>
          <p className='text-sm text-muted-foreground'>
            Sign in to continue to WhatsUp
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='email' className='text-muted-foreground text-sm'>
              Email address
            </Label>
            <div className='relative'>
              <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                id='email'
                type='email'
                placeholder='you@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='pl-10 h-12 bg-secondary border-0 focus:ring-2 focus:ring-primary/50'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='password' className='text-muted-foreground text-sm'>
              Password
            </Label>
            <div className='relative'>
              <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                placeholder='••••••••'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='pl-10 pr-10 h-12 bg-secondary border-0 focus:ring-2 focus:ring-primary/50'
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
              >
                {showPassword ? (
                  <EyeOff className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
              </button>
            </div>
          </div>

          <div className='flex items-center justify-end'>
            <Link
              to='/forgot-password'
              className='text-sm text-primary hover:underline'
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type='submit'
            disabled={isLoading}
            className='w-full h-12 gradient-glow text-white font-medium hover:opacity-90 transition-opacity'
          >
            {isLoading ? (
              <Loader2 className='h-5 w-5 animate-spin' />
            ) : (
              <>
                Sign in
                <ArrowRight className='ml-2 h-4 w-4' />
              </>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-border' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-card px-2 text-muted-foreground'>or</span>
          </div>
        </div>

        {/* Register link */}
        <p className='text-center text-sm text-muted-foreground'>
          Don't have an account?{' '}
          <Link
            to='/register'
            className='text-primary hover:underline font-medium'
          >
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
