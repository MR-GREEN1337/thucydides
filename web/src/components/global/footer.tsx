import Link from 'next/link';
import { Logo } from '@/components/global/logo';
import { Github, Twitter } from 'lucide-react';

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <Link href={href} className="text-neutral-400 transition-colors hover:text-white">
      {children}
    </Link>
  </li>
);

export function Footer() {
  return (
    <footer className="w-full bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 px-6 py-10 md:grid-cols-4 md:gap-x-8 md:px-8 md:py-12">
        {/* Column 1: Logo & Copyright */}
        <div className="col-span-2 flex flex-col gap-4 pr-8 md:col-span-1">
          <Logo />
          <p className="text-sm text-neutral-400">
            Converse with history, grounded in truth.
          </p>
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} Thucydides. All rights reserved.
          </p>
        </div>

        {/* Column 2: Product */}
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-white">Product</h3>
          <ul className="space-y-3 text-sm">
            <FooterLink href="/archive">The Archive</FooterLink>
            <FooterLink href="/pricing">Pricing</FooterLink>
            <FooterLink href="/changelog">Changelog</FooterLink>
          </ul>
        </div>

        {/* Column 3: Company */}
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-white">Company</h3>
          <ul className="space-y-3 text-sm">
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/blog">Blog</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
          </ul>
        </div>

        {/* Column 4: Legal & Socials */}
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-white">Legal</h3>
          <ul className="space-y-3 text-sm">
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
            <FooterLink href="/terms">Terms of Service</FooterLink>
          </ul>
           <div className="mt-4 flex items-center gap-4">
            <a href="#" className="text-neutral-500 transition-colors hover:text-white p-2 rounded-lg hover:bg-white/10">
              <Github className="h-5 w-5" />
            </a>
            <a href="#" className="text-neutral-500 transition-colors hover:text-white p-2 rounded-lg hover:bg-white/10">
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Subtle gradient overlay at bottom to blend with background */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </footer>
  );
}
