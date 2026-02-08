'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BentoItemProps {
  src: string;
  alt: string;
  label: string;
  className?: string;
}

function BentoItem({ src, alt, label, className }: BentoItemProps) {
  return (
    <div className={cn(
      'group relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.08]',
      'hover:border-white/[0.15] transition-all duration-500',
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover object-top"
        priority
      />
      <div className="absolute bottom-4 left-4 z-20">
        <span className="text-sm font-medium text-white/90">{label}</span>
      </div>
    </div>
  );
}

export function ProductShowcase() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1200px] mx-auto">
      {/* Large item - Practice Hub */}
      <div className="md:col-span-2 lg:col-span-2 relative aspect-[16/9] md:aspect-[2/1]">
        <BentoItem
          src="/screenshots/practice-hub.png"
          alt="Practice hub with categories"
          label="Practice categories"
          className="absolute inset-0"
        />
      </div>

      {/* Typing session - tall on desktop */}
      <div className="relative aspect-[4/3] lg:aspect-auto lg:row-span-2">
        <BentoItem
          src="/screenshots/typing-session.png"
          alt="Live typing session"
          label="Real-time feedback"
          className="absolute inset-0"
        />
      </div>

      {/* Stats */}
      <div className="relative aspect-[16/9]">
        <BentoItem
          src="/screenshots/stats.png"
          alt="Statistics dashboard"
          label="Track progress"
          className="absolute inset-0"
        />
      </div>

      {/* Smart practice */}
      <div className="relative aspect-[16/9]">
        <BentoItem
          src="/screenshots/smart-practice.png"
          alt="Smart practice mode"
          label="AI-powered practice"
          className="absolute inset-0"
        />
      </div>
    </div>
  );
}
