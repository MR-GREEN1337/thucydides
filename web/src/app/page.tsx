"use client"

import Link from 'next/link';
import { ArrowRight, Users, Shield, Star, MessageCircle, BookOpen, Check } from 'lucide-react';
import { Logo } from '@/components/global/logo';
import { Footer } from '@/components/global/footer';
import { Button } from '@/components/ui/button';
import AnimatedGradientBackground from '@/components/global/animated-gradient-background';
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <div className="relative">
      {/* Continuous animated background for entire page with grain texture */}
      <div className="absolute inset-0 overflow-hidden">
        <AnimatedGradientBackground
          startingGap={60}
          Breathing={true}
          breathingRange={15}
          animationSpeed={0.015}
          gradientColors={["#0A0A0A", "#2979FF", "#FF6D00"]}
          gradientStops={[40, 70, 100]}
        />
        {/* Grain/noise texture overlay */}
        <div
          className="absolute inset-0 opacity-10 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='20' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* --- Header --- */}
      <header className="relative z-50 w-full p-4 font-sans">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/blog" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                Blog
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md hidden sm:inline-flex">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild variant="default" className="bg-white text-black hover:bg-zinc-200">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* --- Hero Section --- */}
      <section className="relative z-10 container mx-auto flex flex-col items-center justify-start mt-16 p-4 text-center min-h-screen pb-20 md:pb-32">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
          <Link href="/changelog" className="inline-flex items-center gap-x-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-zinc-300 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white mb-6">
            <span>Now in Public Beta</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <h1 className="[font-family:var(--font-eb-garamond)] text-5xl text-white font-bold tracking-normal sm:text-6xl md:text-7xl [text-wrap:balance]">
            History Speaks.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-300 md:text-xl font-sans">
            Converse with history's greatest minds, grounded in truth.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-black hover:bg-zinc-200 px-8 py-3 text-lg font-semibold">
              <Link href="/signup">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md px-8 py-3 text-lg">
              <Link href="#features">
                Learn More
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* --- Features Section --- */}
      <section id="features" className="relative z-10 container mx-auto px-4 py-12 md:py-16">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why Choose Thucydides?</h2>
            <p className="text-zinc-300 max-w-2xl mx-auto">
              Experience authentic conversations with historical figures, backed by rigorous research and factual accuracy.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="group relative text-center bg-white/5 p-6 rounded-xl border border-white/10 transition-all duration-300 hover:border-blue-400/50 hover:bg-white/10 hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4 ring-2 ring-blue-500/30">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Historically Accurate</h3>
              <p className="text-zinc-400 text-sm">Every conversation is grounded in documented historical facts and verified sources.</p>
            </div>

            <div className="group relative text-center bg-white/5 p-6 rounded-xl border border-white/10 transition-all duration-300 hover:border-purple-400/50 hover:bg-white/10 hover:-translate-y-1">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4 ring-2 ring-purple-500/30">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">150+ Figures</h3>
              <p className="text-zinc-400 text-sm">From ancient philosophers to modern leaders, spanning 2,500 years of history.</p>
            </div>

            <div className="group relative text-center bg-white/5 p-6 rounded-xl border border-white/10 transition-all duration-300 hover:border-green-400/50 hover:bg-white/10 hover:-translate-y-1">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4 ring-2 ring-green-500/30">
                <MessageCircle className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Natural Dialogue</h3>
              <p className="text-zinc-400 text-sm">Engage in flowing conversations that feel authentic to each historical period.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- How It Works Section --- */}
      <section className="relative z-10 container mx-auto px-4 py-12 md:py-16">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-zinc-300 max-w-2xl mx-auto">
              Start your journey through history in three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold">1</div>
              <h3 className="text-lg font-semibold text-white mb-2">Choose Your Figure</h3>
              <p className="text-zinc-400 text-sm">Browse our extensive archive and select from philosophers, leaders, artists, and innovators.</p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold">2</div>
              <h3 className="text-lg font-semibold text-white mb-2">Start Conversing</h3>
              <p className="text-zinc-400 text-sm">Ask questions, discuss ideas, and explore their thoughts on topics that matter to you.</p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold">3</div>
              <h3 className="text-lg font-semibold text-white mb-2">Learn & Discover</h3>
              <p className="text-zinc-400 text-sm">Gain insights from history's greatest minds and discover new perspectives.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- The Vision Section --- */}
      <section className="relative z-10 container mx-auto px-4 py-12 md:py-16">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4 [text-wrap:balance]">The Vision: Ask History a Question</h2>
            <p className="text-zinc-300 max-w-3xl mx-auto">
              Decades ago, Steve Jobs dreamed of a day when we could do more than just read what historical figures wrote—we could interact with their knowledge. Thucydides is the realization of that vision.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 shadow-lg">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/YYjlCrpH2is"
                title="Steve Jobs on asking Aristotle a question"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <p className="text-center text-sm text-white mt-4">
                Steve Jobs at the International Design Conference in Aspen, 1983.
            </p>
          </div>
        </div>
      </section>

      {/* --- Testimonials Section --- */}
      <section className="relative z-10 container mx-auto px-4 py-12 md:py-16">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">What Users Say</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-zinc-300 mb-4">
                "Incredible experience talking to Marcus Aurelius about stoicism. The responses felt authentic and helped me understand ancient philosophy in a new way."
              </p>
              <div className="text-sm text-zinc-400">— Sarah M., Philosophy Student</div>
            </div>

            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-zinc-300 mb-4">
                "As a history teacher, this tool has transformed how I engage my students. They're having actual conversations with historical figures!"
              </p>
              <div className="text-sm text-zinc-400">— David R., History Teacher</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Pricing Section --- */}
      <section id="pricing" className="relative z-10 container mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Find the Plan for You</h2>
          <p className="text-zinc-300 max-w-2xl mx-auto">
            Start for free and upgrade to unlock the full potential of historical dialogue.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-center">
          {/* Hobby Plan */}
          <div className="flex flex-col h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg transition-all duration-300 hover:border-zinc-700 hover:bg-white/10">
            <h3 className="text-xl font-semibold text-white mb-2">Hobby</h3>
            <p className="text-zinc-400 mb-6">For the curious explorer.</p>
            <p className="text-4xl font-bold text-white mb-1">$0<span className="text-lg font-normal text-zinc-400">/month</span></p>
            <p className="text-sm text-zinc-500 mb-8">Get a taste of history.</p>
            <ul className="space-y-3 text-zinc-300 text-sm mb-8 flex-grow">
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-500" />3 dialogues per month</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-500" />Access to 10 featured figures</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-500" />Standard source citations</li>
            </ul>
            <Button asChild variant="outline" className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md">
              <Link href="/signup">Start for Free</Link>
            </Button>
          </div>

          {/* Scholar Plan (Highlighted) */}
          <div className="relative flex flex-col h-full bg-gradient-to-br from-zinc-900/80 to-purple-950/50 backdrop-blur-xl border border-purple-500/50 rounded-2xl p-8 shadow-2xl shadow-purple-500/10">
             <div className="absolute top-0 -translate-y-1/2 w-full px-8">
                <div className="w-fit mx-auto rounded-full bg-purple-600 px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Scholar</h3>
            <p className="text-purple-300 mb-6">For students, academics, and avid researchers.</p>
            <p className="text-4xl font-bold text-white mb-1">$20<span className="text-lg font-normal text-zinc-400">/month</span></p>
            <p className="text-sm text-zinc-500 mb-8">Billed annually or $25 monthly.</p>
            <ul className="space-y-3 text-zinc-300 text-sm mb-8 flex-grow">
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-purple-400" />Unlimited dialogues</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-purple-400" />Access to the full 150+ figure archive</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-purple-400" />Advanced source analysis & export</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-purple-400" />Save & organize conversations</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-purple-400" />Priority support</li>
            </ul>
            <Button asChild className="w-full bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20">
              <Link href="/signup?plan=scholar">Get Started with Scholar</Link>
            </Button>
          </div>

          {/* Institution Plan */}
          <div className="flex flex-col h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg transition-all duration-300 hover:border-zinc-700 hover:bg-white/10">
            <h3 className="text-xl font-semibold text-white mb-2">Institution</h3>
            <p className="text-zinc-400 mb-6">For universities and research teams.</p>
            <p className="text-4xl font-bold text-white mb-1">Custom</p>
            <p className="text-sm text-zinc-500 mb-8">Collaborate and manage access.</p>
            <ul className="space-y-3 text-zinc-300 text-sm mb-8 flex-grow">
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-500" />All Scholar features, plus:</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-500" />Multi-seat management</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-500" />Centralized billing</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-500" />Dedicated account manager</li>
            </ul>
            <Button asChild variant="outline" className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md">
              <Link href="/contact-sales">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section id="cta" className="relative z-10 container mx-auto px-4 py-12 md:py-16">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-white/20 rounded-2xl p-8 md:p-12 shadow-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Meet History?</h2>
          <p className="text-zinc-300 mb-8 max-w-2xl mx-auto text-lg">
            Join thousands of learners, educators, and history enthusiasts already exploring the past through conversation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-black hover:bg-zinc-200 px-8 py-3 text-lg font-semibold">
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md px-8 py-3 text-lg">
              <Link href="/archive">
                <BookOpen className="mr-2 h-5 w-5" />
                Browse Archive
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* --- Footer Card --- */}
      <div className="relative z-10 p-4 pb-8">
        <Footer />
      </div>
    </div>
  );
}
