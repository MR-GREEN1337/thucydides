import Link from 'next/link';
import { Playfair_Display } from "next/font/google";
import { Feather } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  hideText?: boolean;
  size?: 'default' | 'large';
  href?: string; // Add optional href prop
}

const playfair = Playfair_Display({
    subsets: ["latin"],
    weight: "700",
  });

export function Logo({ className, hideText = false, size = 'default', href = '/' }: LogoProps) {
  return (
    <Link
      href={href} // Use the href prop here
      className={cn(
        "flex items-center",
        size === 'default' && "gap-2",
        size === 'large' && "gap-3",
        className
      )}
    >
      <div className={cn(
        "flex items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-orange-400 shadow-md",
        size === 'default' && "p-1",
        size === 'large' && "p-2",
      )}>
        <Feather className={cn(
          "text-white",
          size === 'default' && "h-4 w-4",
          size === 'large' && "h-6 w-6",
        )} />
      </div>
      <span
        className={cn(
          "font-semibold tracking-tight text-white",
          playfair.className,
          size === 'default' && "text-lg",
          size === 'large' && "text-2xl",
          hideText && "sr-only"
        )}
      >
        Thucydides
      </span>
    </Link>
  );
}
