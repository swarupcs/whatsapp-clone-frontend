import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, MessageCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRegister } from '@/hooks/queries/useAuth';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    await registerMutation.mutateAsync({ name, email, password });
    navigate('/');
  };

  return (
    <div className='auth-container'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='auth-card'
      >
        <div className='flex flex-col items-center space-y-2'>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className='h-16 w-16 rounded-2xl gradient-glow flex items-center justify-center'
          >
            <MessageCircle className='h-8 w-8 text-white' />
          </motion.div>
          <h1 className='text-2xl font-bold tracking-tight'>Create account</h1>
          <p className='text-sm text-muted-foreground'>Join WhatsUp and start chatting</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name' className='text-muted-foreground text-sm'>Full name</Label>
            <div className='relative'>
              <User className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                id='name'
                type='text'
                placeholder='John Doe'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='pl-10 h-12 bg-secondary border-0 focus:ring-2 focus:ring-primary/50'
                required
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='email' className='text-muted-foreground text-sm'>Email address</Label>
            <div className='relative'>
              <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                id='email'
                type='email'
                placeholder='you@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='pl-10 h-12 bg-secondary border-0 focus:ring-2 focus:ring-primary/50'
                required
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='password' className='text-muted-foreground text-sm'>Password</Label>
            <div className='relative'>
              <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                placeholder='••••••••'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='pl-10 pr-10 h-12 bg-secondary border-0 focus:ring-2 focus:ring-primary/50'
                required
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
              >
                {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
              </button>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='confirmPassword' className='text-muted-foreground text-sm'>Confirm password</Label>
            <div className='relative'>
              <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                id='confirmPassword'
                type={showPassword ? 'text' : 'password'}
                placeholder='••••••••'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className='pl-10 h-12 bg-secondary border-0 focus:ring-2 focus:ring-primary/50'
                required
              />
            </div>
          </div>

          <Button
            type='submit'
            disabled={registerMutation.isPending}
            className='w-full h-12 gradient-glow text-white font-medium hover:opacity-90 transition-opacity'
          >
            {registerMutation.isPending ? (
              <Loader2 className='h-5 w-5 animate-spin' />
            ) : (
              <>Create account <ArrowRight className='ml-2 h-4 w-4' /></>
            )}
          </Button>
        </form>

        <p className='text-center text-xs text-muted-foreground'>
          By creating an account, you agree to our{' '}
          <Link to='/terms' className='text-primary hover:underline'>Terms of Service</Link>
          {' '}and{' '}
          <Link to='/privacy' className='text-primary hover:underline'>Privacy Policy</Link>
        </p>

        <p className='text-center text-sm text-muted-foreground'>
          Already have an account?{' '}
          <Link to='/login' className='text-primary hover:underline font-medium'>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
