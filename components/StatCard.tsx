import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from './icons';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  trend?: {
    value: number;
    label: string;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'text-indigo-500 dark:text-indigo-400', trend }) => {
  const isPositive = trend ? trend.value >= 0 : false;
  const trendColor = isPositive ? 'text-green-500' : 'text-red-500';

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-start justify-between transition-transform transform hover:scale-105">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className={`text-2xl font-bold text-gray-900 dark:text-white ${color.includes('green') ? 'text-green-500' : color.includes('red') ? 'text-red-500' : ''}`}>{value}</p>
        {trend && (
            <div className={`flex items-center text-sm mt-1 ${trendColor}`}>
                {isPositive ? <ArrowUpIcon /> : <ArrowDownIcon />}
                <span>{trend.value.toFixed(1)}%</span>
                <span className="ml-1 text-gray-500 dark:text-gray-400">{trend.label}</span>
            </div>
        )}
      </div>
       <div className={`p-3 rounded-full bg-gray-100 dark:bg-gray-700 ${color}`}>
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
