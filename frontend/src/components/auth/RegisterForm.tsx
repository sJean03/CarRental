'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUpload } from '@/components/ui/file-upload';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/authStore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { CheckCircle, Clock, Mail, ArrowRight } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, 'Password must contain at least one uppercase letter, one number, and one special character'),
  confirm_password: z.string(),
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  phone_number: z.string()
    .regex(/^\+63\s?\d{3}\s?\d{3}\s?\d{4}$/, 'Phone number must be in format: +63 917 688 5315')
    .optional()
    .or(z.literal('')),
  drivers_license_photo_url: z.string().min(1, "Driver's license photo is required"),
  role: z.enum(['customer', 'owner']),
  terms_accepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions to continue',
  }),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// Success Modal Component
function SuccessModal({ email, role, onClose }: { email: string; role: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse"></div>
            <CheckCircle className="w-20 h-20 text-green-500 relative" strokeWidth={1.5} />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Thank You!
          </h2>
          <p className="text-gray-600">
            Your account has been successfully created
          </p>
        </div>

        {/* Email Confirmation */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-gray-700 flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <span>
              <span className="font-semibold">Confirmation sent to:</span>
              <br />
              <span className="text-blue-600 font-medium">{email}</span>
            </span>
          </p>
        </div>

        {/* Verification Steps */}
        <div className="space-y-3 text-left bg-amber-50 rounded-lg p-4 border border-amber-200">
          <p className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Verification in Progress
          </p>
          <ul className="space-y-2 text-sm text-gray-700 ml-7">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold text-lg leading-none mt-0.5">1.</span>
              <span>Our team is reviewing your driver's license</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold text-lg leading-none mt-0.5">2.</span>
              <span>We'll verify your identity for security</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold text-lg leading-none mt-0.5">3.</span>
              <span>You'll receive an approval email within 24 hours</span>
            </li>
          </ul>
        </div>

        {/* Info Box */}
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <p className="text-sm text-indigo-900">
            <span className="font-semibold">What's next?</span>
            <br />
            Once approved, you can start {role === 'owner' ? 'listing your cars for rent' : 'renting cars'} immediately!
          </p>
        </div>

        {/* Buttons */}
        <button
          onClick={onClose}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ email: string; role: string } | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirm_password: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      drivers_license_photo_url: '',
      role: 'customer',
      terms_accepted: false,
    },
  });

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, '');

    if (!cleaned.startsWith('+63')) {
      if (cleaned.startsWith('63')) {
        return '+' + cleaned;
      } else if (cleaned.startsWith('0')) {
        return '+63' + cleaned.slice(1);
      } else if (cleaned.length > 0 && !cleaned.startsWith('+')) {
        return '+63' + cleaned;
      }
      return '+63';
    }

    const digits = cleaned.slice(3);
    if (digits.length <= 3) {
      return `+63 ${digits}`;
    } else if (digits.length <= 6) {
      return `+63 ${digits.slice(0, 3)} ${digits.slice(3)}`;
    } else {
      return `+63 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccess(false);
    
    // Redirect based on role
    if (successData?.role === 'owner') {
      router.push('/owner/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      const { confirm_password, terms_accepted, ...registerData } = data;
      console.log('Submitting registration with data:', registerData);
      const response = await authApi.register(registerData);
      console.log('Registration response:', response);

      if (response.success && response.data) {
        const { user, token } = response.data;

        setUser(user);
        setToken(token);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Show success modal instead of redirecting immediately
        setSuccessData({ email: user.email, role: user.role });
        setShowSuccess(true);

        toast.success('Registration successful!');
      } else {
        const message = response.message || 'Registration failed. Please try again.';
        toast.error(message);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess && successData) {
    return <SuccessModal email={successData.email} role={successData.role} onClose={handleSuccessModalClose} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Juan" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Dela Cruz" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="juan@example.com"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="+63 912 345 6789"
                  {...field}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    field.onChange(formatted);
                  }}
                  maxLength={17}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="drivers_license_photo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Driver's License Photo *</FormLabel>
              <FormControl>
                <FileUpload
                  onUploadComplete={(url) => field.onChange(url)}
                  onUploadError={(error) => toast.error(error)}
                  value={field.value}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Please upload a clear photo showing both the front and back of your valid driver's license for verification.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>I want to</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="customer">Rent cars</SelectItem>
                  <SelectItem value="owner">List my car for rent</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="terms_accepted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  I agree to the{' '}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-blue-600 hover:underline"
                  >
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="text-blue-600 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </FormLabel>
                <FormDescription>
                  You must accept the terms and conditions to create an account
                </FormDescription>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <p className="text-xs text-gray-500">
                Password must be at least 8 characters and include at least one uppercase letter, one number, and one special character.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirm_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
    </Form>
  );
}