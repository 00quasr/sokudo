'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FolderOpen,
  Users,
  Clock,
  FileText,
  X,
} from 'lucide-react';
import Link from 'next/link';

interface Collection {
  id: number;
  name: string;
  description: string | null;
  createdAt: string | Date;
  authorName: string | null;
  authorEmail: string;
  challengeCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface CollectionData {
  collections: Collection[];
  pagination: Pagination;
}

type SortBy = 'createdAt' | 'name' | 'challengeCount';

const sortOptions: { value: SortBy; label: string }[] = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'challengeCount', label: 'Most Challenges' },
  { value: 'name', label: 'Name' },
];

export function CollectionBrowser({
  initialData,
}: {
  initialData: CollectionData;
}) {
  const [data, setData] = useState<CollectionData>(initialData);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [loading, setLoading] = useState(false);

  const fetchCollections = useCallback(
    async (params: { page?: number; search?: string; sortBy?: SortBy }) => {
      setLoading(true);
      try {
        const searchParams = new URLSearchParams();
        searchParams.set('page', String(params.page ?? 1));
        searchParams.set('limit', '20');
        searchParams.set('sortBy', params.sortBy ?? sortBy);
        searchParams.set('sortOrder', params.sortBy === 'name' ? 'asc' : 'desc');
        if (params.search) {
          searchParams.set('search', params.search);
        }

        const res = await fetch(`/api/collections?${searchParams}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    },
    [sortBy]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCollections({ page: 1, search, sortBy });
  };

  const handleSortChange = (newSort: SortBy) => {
    setSortBy(newSort);
    fetchCollections({ page: 1, search, sortBy: newSort });
  };

  const handlePageChange = (page: number) => {
    fetchCollections({ page, search, sortBy });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearch('');
    setSortBy('createdAt');
    fetchCollections({ page: 1, search: '', sortBy: 'createdAt' });
  };

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                type="text"
                placeholder="Search collections..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>

          <div className="flex gap-1">
            {sortOptions.map((option) => (
              <Button
                key={option.value}
                variant={sortBy === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange(option.value)}
                className={sortBy === option.value ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
              >
                <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {search && (
          <div className="flex items-center">
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-white/50 hover:text-white/70 flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-5 bg-white/[0.08] rounded w-1/3" />
                  <div className="h-4 bg-white/[0.06] rounded w-2/3" />
                  <div className="h-3 bg-white/[0.06] rounded w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data.collections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <FolderOpen className="h-12 w-12 text-white/40 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No collections found
            </h3>
            <p className="text-sm text-white/50 max-w-sm">
              {search
                ? 'Try a different search term or clear your search.'
                : 'Be the first to share a collection with the community!'}
            </p>
            {search && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearch('');
                  fetchCollections({ page: 1, search: '', sortBy });
                }}
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-white/50 mb-4">
            {data.pagination.total} collection{data.pagination.total !== 1 ? 's' : ''} found
          </p>

          <div className="grid gap-4">
            {data.collections.map((collection) => (
              <CollectionRow key={collection.id} collection={collection} />
            ))}
          </div>

          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={!data.pagination.hasPrevPage}
                onClick={() => handlePageChange(data.pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-white/60 px-4">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.pagination.hasNextPage}
                onClick={() => handlePageChange(data.pagination.page + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CollectionRow({ collection }: { collection: Collection }) {
  const authorDisplay = collection.authorName || collection.authorEmail.split('@')[0];
  const createdDate = new Date(collection.createdAt).toLocaleDateString();

  return (
    <Link href={`/collections/${collection.id}`}>
      <Card className="transition-all hover:border-orange-300 hover:shadow-md cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white truncate">
                {collection.name}
              </h3>
              {collection.description && (
                <p className="mt-1 text-sm text-white/60 line-clamp-2">
                  {collection.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-white/50">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {authorDisplay}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {collection.challengeCount} challenge{collection.challengeCount !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {createdDate}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
