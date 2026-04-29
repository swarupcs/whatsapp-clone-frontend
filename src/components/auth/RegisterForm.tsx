import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, Loader2, Zap, Camera, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useRegister } from '@/hooks/queries/useAuth';
import SwiftChatLogo from '@/components/shared/SwiftChatLogo';

const TOTAL_STEPS = 3;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export default function RegisterForm() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [about, setAbout] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const nextStep = () => {
    if (step === 1 && (!name || !email)) {
      toast.error('Please fill in all fields');
      return;
    }
    if (step === 2) {
      if (!password || !confirmPassword) { toast.error('Please fill in all fields'); return; }
      if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
      if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    }
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerMutation.mutateAsync({ name, email, password });
    navigate('/');
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className='min-h-screen flex'>
      {/* Left panel — branding */}
      <div className='hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center'>
        <div className='absolute inset-0 bg-[#0d0d0f]'>
          <motion.div
            animate={{
              background: [
                'radial-gradient(ellipse at 30% 40%, rgba(139,92,246,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(255,126,53,0.12) 0%, transparent 60%)',
                'radial-gradient(ellipse at 70% 30%, rgba(56,189,248,0.12) 0%, transparent 60%), radial-gradient(ellipse at 30% 70%, rgba(139,92,246,0.15) 0%, transparent 60%)',
                'radial-gradient(ellipse at 30% 40%, rgba(139,92,246,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(255,126,53,0.12) 0%, transparent 60%)',
              ],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className='absolute inset-0'
          />
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -15, 0],
                opacity: [0.08, 0.2, 0.08],
                rotate: [0, 10, 0],
              }}
              transition={{ duration: 5 + i, repeat: Infinity, delay: i * 0.8 }}
              className='absolute'
              style={{ left: `${20 + i * 20}%`, top: `${25 + (i % 2) * 30}%` }}
            >
              <Zap className='h-10 w-10 text-brand-violet/20 fill-brand-violet/10' />
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
            Join SwiftChat
          </h1>
          <p className='text-lg text-muted-foreground max-w-md mx-auto leading-relaxed'>
            Start connecting in seconds
          </p>
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

          <div className='space-y-2 mb-6'>
            <h2 className='font-display text-3xl font-bold tracking-tight'>Create account</h2>
            <p className='text-muted-foreground'>Step {step} of {TOTAL_STEPS}</p>
          </div>

          {/* Progress bar */}
          <div className='h-1 bg-secondary rounded-full mb-8 overflow-hidden'>
            <motion.div
              className='h-full gradient-primary rounded-full'
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className='relative overflow-hidden min-h-[280px]'>
              <AnimatePresence mode='wait' custom={direction}>
                {step === 1 && (
                  <motion.div
                    key='step1'
                    custom={direction}
                    variants={slideVariants}
                    initial='enter'
                    animate='center'
                    exit='exit'
                    transition={{ duration: 0.3 }}
                    className='space-y-5'
                  >
                    <div className='space-y-2'>
                      <Label htmlFor='reg-name' className='text-muted-foreground text-sm font-medium'>Full name</Label>
                      <div className='relative'>
                        <User className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                        <Input
                          id='reg-name'
                          type='text'
                          placeholder='John Doe'
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className='pl-11 h-12 bg-secondary border-border/50 rounded-xl focus:ring-2 focus:ring-primary/50 transition-all'
                          required
                        />
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='reg-email' className='text-muted-foreground text-sm font-medium'>Email address</Label>
                      <div className='relative'>
                        <Mail className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                        <Input
                          id='reg-email'
                          type='email'
                          placeholder='you@example.com'
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className='pl-11 h-12 bg-secondary border-border/50 rounded-xl focus:ring-2 focus:ring-primary/50 transition-all'
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key='step2'
                    custom={direction}
                    variants={slideVariants}
                    initial='enter'
                    animate='center'
                    exit='exit'
                    transition={{ duration: 0.3 }}
                    className='space-y-5'
                  >
                    <div className='space-y-2'>
                      <Label htmlFor='reg-password' className='text-muted-foreground text-sm font-medium'>Password</Label>
                      <div className='relative'>
                        <Lock className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                        <Input
                          id='reg-password'
                          type={showPassword ? 'text' : 'password'}
                          placeholder='••••••••'
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className='pl-11 pr-11 h-12 bg-secondary border-border/50 rounded-xl focus:ring-2 focus:ring-primary/50 transition-all'
                          required
                        />
                        <button
                          type='button'
                          onClick={() => setShowPassword(!showPassword)}
                          className='absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                        </button>
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='reg-confirm' className='text-muted-foreground text-sm font-medium'>Confirm password</Label>
                      <div className='relative'>
                        <Lock className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                        <Input
                          id='reg-confirm'
                          type={showPassword ? 'text' : 'password'}
                          placeholder='••••••••'
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className='pl-11 h-12 bg-secondary border-border/50 rounded-xl focus:ring-2 focus:ring-primary/50 transition-all'
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key='step3'
                    custom={direction}
                    variants={slideVariants}
                    initial='enter'
                    animate='center'
                    exit='exit'
                    transition={{ duration: 0.3 }}
                    className='space-y-5'
                  >
                    <div className='flex flex-col items-center'>
                      <div className='relative group'>
                        <div className='h-24 w-24 rounded-full gradient-primary flex items-center justify-center'>
                          <User className='h-10 w-10 text-white' />
                        </div>
                        <div className='absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'>
                          <Camera className='h-6 w-6 text-white' />
                        </div>
                      </div>
                      <p className='text-sm text-muted-foreground mt-3'>Upload a photo (optional)</p>
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='reg-about' className='text-muted-foreground text-sm font-medium flex items-center gap-1.5'>
                        <Info className='h-3.5 w-3.5' /> Bio (optional)
                      </Label>
                      <Textarea
                        id='reg-about'
                        value={about}
                        onChange={(e) => setAbout(e.target.value)}
                        placeholder='Tell us about yourself...'
                        className='bg-secondary border-border/50 rounded-xl resize-none focus:ring-2 focus:ring-primary/50 transition-all'
                        rows={3}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation buttons */}
            <div className='flex gap-3 mt-8'>
              {step > 1 && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={prevStep}
                    className='h-12 px-6 rounded-xl border-border/50'
                  >
                    <ArrowLeft className='h-4 w-4 mr-2' /> Back
                  </Button>
                </motion.div>
              )}
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className='flex-1'>
                {step < TOTAL_STEPS ? (
                  <Button
                    type='button'
                    onClick={nextStep}
                    className='w-full h-12 rounded-xl gradient-glow text-white font-semibold hover:shadow-lg hover:shadow-brand-orange/25 transition-shadow'
                  >
                    Continue <ArrowRight className='ml-2 h-4 w-4' />
                  </Button>
                ) : (
                  <Button
                    type='submit'
                    disabled={registerMutation.isPending}
                    className='w-full h-12 rounded-xl gradient-glow text-white font-semibold hover:shadow-lg hover:shadow-brand-orange/25 transition-shadow'
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className='h-5 w-5 animate-spin' />
                    ) : (
                      <>Create account <ArrowRight className='ml-2 h-4 w-4' /></>
                    )}
                  </Button>
                )}
              </motion.div>
            </div>
          </form>

          <p className='text-center text-sm text-muted-foreground mt-8'>
            Already have an account?{' '}
            <Link to='/login' className='text-primary hover:underline font-semibold'>
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
