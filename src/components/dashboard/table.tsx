import React from "react"

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode
}

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode
}

interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode
}

interface TableHeadProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode
}

interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode
}

interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {
  children: React.ReactNode
}

export function Table({ className, children, ...props }: TableProps) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        className={`w-full caption-bottom text-sm ${className || ''}`}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ className, children, ...props }: TableHeaderProps) {
  return (
    <thead className={`[&_tr]:border-b ${className || ''}`} {...props}>
      {children}
    </thead>
  )
}

export function TableBody({ className, children, ...props }: TableBodyProps) {
  return (
    <tbody className={`[&_tr:last-child]:border-0 ${className || ''}`} {...props}>
      {children}
    </tbody>
  )
}

export function TableFooter({ className, children, ...props }: TableFooterProps) {
  return (
    <tfoot
      className={`border-t bg-gray-50/50 font-medium [&>tr]:last:border-b-0 ${className || ''}`}
      {...props}
    >
      {children}
    </tfoot>
  )
}

export function TableRow({ className, children, ...props }: TableRowProps) {
  return (
    <tr
      className={`border-b transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-gray-50 ${className || ''}`}
      {...props}
    >
      {children}
    </tr>
  )
}

export function TableHead({ className, children, ...props }: TableHeadProps) {
  return (
    <th
      className={`h-12 px-4 text-left align-middle font-medium text-gray-900 [&:has([role=checkbox])]:pr-0 ${className || ''}`}
      {...props}
    >
      {children}
    </th>
  )
}

export function TableCell({ className, children, ...props }: TableCellProps) {
  return (
    <td
      className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className || ''}`}
      {...props}
    >
      {children}
    </td>
  )
}

export function TableCaption({ className, children, ...props }: TableCaptionProps) {
  return (
    <caption
      className={`mt-4 text-sm text-gray-500 ${className || ''}`}
      {...props}
    >
      {children}
    </caption>
  )
}