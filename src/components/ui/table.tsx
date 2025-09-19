// Table Component for RLS Guard Dog
// Created: September 19, 2025
// Description: Reusable table component for data display

import React from 'react';
import { cn } from '@/lib/utils';

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-sm', className)}
      {...props}
    >
      {children}
    </table>
  </div>
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

// Enhanced table with sorting and pagination
interface EnhancedTableProps<T> {
  readonly data: readonly T[];
  readonly columns: readonly {
    readonly key: keyof T;
    readonly header: string;
    readonly sortable?: boolean;
    readonly render?: (value: T[keyof T], row: T) => React.ReactNode;
  }[];
  readonly onRowClick?: (row: T) => void;
  readonly sortKey?: keyof T;
  readonly sortOrder?: 'asc' | 'desc';
  readonly onSort?: (key: keyof T, order: 'asc' | 'desc') => void;
  readonly className?: string;
}

function EnhancedTable<T extends Record<string, unknown>>({
  data,
  columns,
  onRowClick,
  sortKey,
  sortOrder,
  onSort,
  className,
}: EnhancedTableProps<T>) {
  const handleSort = (key: keyof T) => {
    if (!onSort) return;
    
    const newOrder = sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(key, newOrder);
  };

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={String(column.key)}
              className={column.sortable ? 'cursor-pointer select-none' : ''}
              onClick={() => column.sortable && handleSort(column.key)}
            >
              <div className="flex items-center space-x-1">
                <span>{column.header}</span>
                {column.sortable && sortKey === column.key && (
                  <span className="text-xs">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, index) => {
          // Create a unique key for the row
          let rowKey = `row-${index}`;
          
          if ('id' in row && typeof row.id === 'string') {
            rowKey = row.id;
          } else if ('id' in row && typeof row.id === 'number') {
            rowKey = String(row.id);
          } else if ('name' in row && typeof row.name === 'string') {
            rowKey = row.name;
          } else {
            // Fallback to a hash of the row content
            rowKey = `row-${index}-${Math.random().toString(36).substr(2, 9)}`;
          }
          
          return (
            <TableRow
              key={rowKey}
              className={onRowClick ? 'cursor-pointer' : ''}
              onClick={() => onRowClick?.(row)}
            >
            {columns.map((column) => (
              <TableCell key={String(column.key)}>
                {column.render
                  ? column.render(row[column.key], row)
                  : String(row[column.key] || '')}
              </TableCell>
            ))}
          </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  EnhancedTable,
};