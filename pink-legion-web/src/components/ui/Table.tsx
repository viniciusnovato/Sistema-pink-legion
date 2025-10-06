'use client';

import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse ${className}`}>
        {children}
      </table>
    </div>
  );
};

const TableHeader: React.FC<TableHeaderProps> = ({ children, className = '' }) => {
  return (
    <thead className={`bg-rose-gold-50 dark:bg-rose-gold-900/20 ${className}`}>
      {children}
    </thead>
  );
};

const TableBody: React.FC<TableBodyProps> = ({ children, className = '' }) => {
  return (
    <tbody className={className}>
      {children}
    </tbody>
  );
};

const TableRow: React.FC<TableRowProps> = ({ children, className = '', onClick }) => {
  return (
    <tr
      className={`
        border-b border-border-light dark:border-border-dark
        hover:bg-rose-gold-25 dark:hover:bg-rose-gold-900/10
        transition-colors duration-150
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

const TableHead: React.FC<TableHeadProps> = ({
  children,
  className = '',
  sortable = false,
  sortDirection = null,
  onSort,
}) => {
  return (
    <th
      className={`
        px-6 py-3 text-left text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary
        uppercase tracking-wider
        ${sortable ? 'cursor-pointer hover:text-rose-gold-600 dark:hover:text-rose-gold-400' : ''}
        ${className}
      `}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortable && (
          <div className="flex flex-col">
            <ChevronUp
              className={`h-3 w-3 ${
                sortDirection === 'asc'
                  ? 'text-rose-gold-600 dark:text-rose-gold-400'
                  : 'text-gray-400'
              }`}
            />
            <ChevronDown
              className={`h-3 w-3 -mt-1 ${
                sortDirection === 'desc'
                  ? 'text-rose-gold-600 dark:text-rose-gold-400'
                  : 'text-gray-400'
              }`}
            />
          </div>
        )}
      </div>
    </th>
  );
};

const TableCell: React.FC<TableCellProps> = ({ children, className = '' }) => {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-text-light-primary dark:text-text-dark-primary ${className}`}>
      {children}
    </td>
  );
};

// Table with built-in styling variants
interface StyledTableProps extends TableProps {
  variant?: 'default' | 'striped' | 'bordered';
}

const StyledTable: React.FC<StyledTableProps> = ({ 
  children, 
  className = '', 
  variant = 'default' 
}) => {
  const variantClasses = {
    default: '',
    striped: '[&_tbody_tr:nth-child(even)]:bg-rose-gold-25 dark:[&_tbody_tr:nth-child(even)]:bg-rose-gold-900/5',
    bordered: 'border border-border-light dark:border-border-dark rounded-lg overflow-hidden',
  };

  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse ${variantClasses[variant]} ${className}`}>
        {children}
      </table>
    </div>
  );
};

export { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell,
  StyledTable 
};