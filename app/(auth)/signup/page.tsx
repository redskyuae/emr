'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-500">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Create your Tenant</h1>
        <p className="text-muted-foreground text-sm">
          Set up your hospital group&apos;s workspace. You&apos;ll become the Tenant Owner.
        </p>
      </div>

      {/* API wiring is intentionally pending — form is UI-only for now */}
      <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            placeholder="Dr. Priya Raghavan"
            autoComplete="name"
            required
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@northgatehealth.com"
            autoComplete="email"
            required
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenant-name">Hospital group name</Label>
          <Input id="tenant-name" placeholder="Northgate Health" required className="h-10" />
          <p className="text-muted-foreground text-xs">
            This becomes your Tenant — you can add hospitals, clinics, and labs as Facilities after
            setup.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
              className="h-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3 transition-colors"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox id="terms" required className="mt-0.5" />
          <Label htmlFor="terms" className="text-muted-foreground font-normal">
            I agree to the{' '}
            <Link href="#" className="text-primary underline-offset-4 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="#" className="text-primary underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
          </Label>
        </div>

        <Button type="submit" className="h-10 w-full text-[15px]">
          Create workspace
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        Already have a workspace?{' '}
        <Link href="/login" className="text-primary font-medium underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
