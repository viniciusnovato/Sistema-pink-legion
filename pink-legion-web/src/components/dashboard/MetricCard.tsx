'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  color?: 'primary' | 'success' | 'info' | 'error' | 'warning';
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  description,
  color = 'primary' 
}: MetricCardProps) {
  const colorClasses = {
    primary: {
      icon: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
      trend: 'text-primary-600 dark:text-primary-400'
    },
    success: {
      icon: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
      trend: 'text-success-600 dark:text-success-400'
    },
    info: {
      icon: 'bg-info-100 dark:bg-info-900/30 text-info-600 dark:text-info-400',
      trend: 'text-info-600 dark:text-info-400'
    },
    error: {
      icon: 'bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400',
      trend: 'text-error-600 dark:text-error-400'
    },
    warning: {
      icon: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
      trend: 'text-warning-600 dark:text-warning-400'
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
              {value}
            </p>
            {description && (
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                {description}
              </p>
            )}
            {trend && (
              <div className="flex items-center mt-2">
                <span className={`text-xs font-medium ${
                  trend.isPositive 
                    ? 'text-success-600 dark:text-success-400' 
                    : 'text-error-600 dark:text-error-400'
                }`}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark ml-1">
                  vs mês anterior
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color].icon}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}