'use client';

import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  extra?: string;
  className?: string;
  valueClassName?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  extra,
  className,
  valueClassName,
}: StatsCardProps) {
  return (
    <div className={cn('bg-card text-card-foreground rounded-xl border p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">{title}</span>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </div>

      <div className="bg-muted/50 dark:bg-neutral-800/50 border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className={cn('text-2xl sm:text-3xl font-medium tracking-tight', valueClassName)}>
            {value}
          </span>

          <div className="flex items-center gap-3">
            <div className="h-9 w-px bg-border" />

            {trend !== undefined ? (
              <div
                className={cn(
                  'flex items-center gap-1.5',
                  trend.isPositive ? 'text-green-400' : 'text-pink-400'
                )}
                style={{
                  textShadow: trend.isPositive
                    ? '0 1px 6px rgba(68, 255, 118, 0.25)'
                    : '0 1px 6px rgba(255, 68, 193, 0.25)',
                }}
              >
                {trend.isPositive ? (
                  <TrendingUp className="size-3.5" />
                ) : (
                  <TrendingDown className="size-3.5" />
                )}
                <span className="text-sm font-medium">{Math.abs(trend.value)}%</span>
              </div>
            ) : extra ? (
              <div className="text-sm font-medium">
                <span className="text-muted-foreground">{extra}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
