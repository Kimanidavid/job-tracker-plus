import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ApplicationStatus, ApplicationType } from '@/types/application';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: ApplicationStatus | 'all';
  onStatusChange: (status: ApplicationStatus | 'all') => void;
  typeFilter: ApplicationType | 'all';
  onTypeChange: (type: ApplicationType | 'all') => void;
  sortBy: 'date' | 'company' | 'status';
  onSortChange: (sort: 'date' | 'company' | 'status') => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const statusOptions: (ApplicationStatus | 'all')[] = [
  'all',
  'Applied',
  'Under Review',
  'Interview Stage',
  'Offer Received',
  'Rejected',
  'Employed',
  'Offer Declined',
  'Withdrawn',
];

const typeOptions: (ApplicationType | 'all')[] = ['all', 'Job', 'Bootcamp', 'Internship', 'Freelance', 'Contract'];

export function SearchFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  sortBy,
  onSortChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
  hasActiveFilters,
}: SearchFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search by job title, company, or keywords..."
          className="pl-9"
        />
      </div>

      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as ApplicationStatus | 'all')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(status => (
              <SelectItem key={status} value={status}>
                {status === 'all' ? 'All Statuses' : status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => onTypeChange(v as ApplicationType | 'all')}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map(type => (
              <SelectItem key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <SlidersHorizontal className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Sort by</Label>
                <Select value={sortBy} onValueChange={(v) => onSortChange(v as 'date' | 'company' | 'status')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date Applied</SelectItem>
                    <SelectItem value="company">Company Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={e => onDateFromChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={e => onDateToChange(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters} className="w-full">
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
