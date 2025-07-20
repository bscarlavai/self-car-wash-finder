import React from 'react';

interface HeroSectionProps {
  title: React.ReactNode;
  description: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export default function HeroSection({ title, description, children, className = '' }: HeroSectionProps) {
  return (
    <section className={`bg-carwash-light-100 pt-12 pb-14 w-full ${className}`}>
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
          {title}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto px-6 sm:px-0">
          {description}
        </p>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
} 