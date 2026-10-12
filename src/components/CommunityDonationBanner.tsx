'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HeartHandshake, ArrowRight, ShieldCheck } from 'lucide-react';

export const CommunityDonationBanner: React.FC = () => {
  return (
    <section
      aria-label="Seksyon Donasyon Kominotè"
      className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800/80 shadow-xl"
    >
      {/* Background Photography with Sophisticated Editorial Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/community_solidarity.jpg"
          alt="Kominote Chofè Legliz k ap soutni youn lòt nan solidarite ak lafwa"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 896px, 960px"
          className="object-cover object-center opacity-40 scale-105 transition-transform duration-700 hover:scale-100"
          priority
        />
        {/* Multi-layered gradient to ensure high readability and premium fintech aesthetic */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40 sm:bg-gradient-to-r sm:from-slate-950 sm:via-slate-950/85 sm:to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 p-6 sm:p-8 md:p-10 max-w-2xl flex flex-col justify-between min-h-[340px] sm:min-h-[380px]">
        {/* Top Tag */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold backdrop-blur-md mb-4">
            <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
            <span>Donasyon PIX • Louvri Pou Tout Moun</span>
          </div>

          {/* Mandatory Headline */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Yon Kominote Ki Ranmase Pou Yon Pi Bon Avni
          </h2>

          {/* Mandatory Supporting Text */}
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl font-normal">
            Chak kontribisyon ede soutni misyon nou epi fè kominote nou pi fò ansanm.
          </p>
        </div>

        {/* Action Button & Trust Info */}
        <div className="mt-6 sm:mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center gap-4">
          <Link
            href="/kontribye"
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm sm:text-base shadow-lg shadow-emerald-950/50 hover:shadow-emerald-500/20 transition-all active:scale-[0.98]"
          >
            <span>Kontribiye Kounye a</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Peman PIX dirèk ak verifikasyon ofisyèl</span>
          </div>
        </div>
      </div>
    </section>
  );
};
