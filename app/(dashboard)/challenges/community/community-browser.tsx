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
  Users,
  Clock,
  FileText,
  Flame,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { VoteButtons } from '@/components/challenges/vote-buttons';
import { ForkButton } from '@/components/challenges/fork-button';

interface CommunityChallenge {
  id: number;
  name: string;
  content: string;
  timesCompleted: number;
  createdAt: string | Date;
  authorName: string | null;
  authorEmail: string;
  votes?: { upvotes: number; downvotes: number; score: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface CommunityData {
  challenges: CommunityChallenge[];
  pagination: Pagination;
}

type SortBy = 'createdAt' | 'timesCompleted' | 'name' | 'score';
type PopularityFilter = '' | '1' | '5' | '10';

const sortOptions: { value: SortBy; label: string }[] = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'timesCompleted', label: 'Most Practiced' },
  { value: 'score', label: 'Top Rated' },
  { value: 'name', label: 'Name' },
];

const popularityOptions: { value: PopularityFilter; label: string }[] = [
  { value: '', label: 'Any' },
  { value: '1', label: '1+' },
  { value: '5', label: '5+' },
  { value: '10', label: '10+' },
];

export function CommunityBrowser({
  initialData,
}: {
  initialData: CommunityData;
}) {
  const [data, setData] = useState<CommunityData>(initialData);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [minPracticed, setMinPracticed] = useState<PopularityFilter>('');
  const [loading, setLoading] = useState(false);

  const fetchChallenges = useCallback(
    async (params: { page?: number; search?: string; sortBy?: SortBy; minPracticed?: string }) => {
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
        const mp = params.minPracticed ?? minPracticed;
        if (mp) {
          searchParams.set('minPracticed', mp);
        }

        const res = await fetch(`/api/community-challenges?${searchParams}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    },
    [sortBy, minPracticed]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchChallenges({ page: 1, search, sortBy, minPracticed });
  };

  const handleSortChange = (newSort: SortBy) => {
    setSortBy(newSort);
    fetchChallenges({ page: 1, search, sortBy: newSort, minPracticed });
  };

  const handlePopularityChange = (newMin: PopularityFilter) => {
    setMinPracticed(newMin);
    fetchChallenges({ page: 1, search, sortBy, minPracticed: newMin });
  };

  const handlePageChange = (page: number) => {
    fetchChallenges({ page, search, sortBy, minPracticed });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearch('');
    setMinPracticed('');
    setSortBy('createdAt');
    fetchChallenges({ page: 1, search: '', sortBy: 'createdAt', minPracticed: '' });
  };

  const hasActiveFilters = search || minPracticed;

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                type="text"
                placeholder="Search challenges..."
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

        {/* Popularity filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/50 flex items-center gap-1">
            <Flame className="h-3.5 w-3.5" />
            Min practiced:
          </span>
          <div className="flex gap-1">
            {popularityOptions.map((option) => (
              <Button
                key={option.value}
                variant={minPracticed === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePopularityChange(option.value)}
                className={minPracticed === option.value ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
              >
                {option.label}
              </Button>
            ))}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-white/50 hover:text-white/70 flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          )}
        </div>
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
      ) : data.challenges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <Users className="h-12 w-12 text-white/40 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No community challenges found
            </h3>
            <p className="text-sm text-white/50 max-w-sm">
              {search
                ? 'Try a different search term or clear your search.'
                : 'Be the first to share a challenge with the community!'}
            </p>
            {search && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearch('');
                  fetchChallenges({ page: 1, search: '', sortBy });
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
            {data.pagination.total} challenge{data.pagination.total !== 1 ? 's' : ''} found
          </p>

          <div className="grid gap-4">
            {data.challenges.map((challenge) => (
              <ChallengeRow key={challenge.id} challenge={challenge} />
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

function ChallengeRow({ challenge }: { challenge: CommunityChallenge }) {
  const authorDisplay = challenge.authorName || challenge.authorEmail.split('@')[0];
  const createdDate = new Date(challenge.createdAt).toLocaleDateString();
  const charCount = challenge.content.length;
  const preview =
    challenge.content.length > 120
      ? challenge.content.slice(0, 120) + '...'
      : challenge.content;

  return (
    <Link href={`/challenges/community/${challenge.id}`}>
      <Card className="transition-all hover:border-orange-300 hover:shadow-md cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white truncate">
                {challenge.name}
              </h3>
              <p className="mt-1 font-mono text-sm text-white/60 line-clamp-2">
                {preview}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-white/50">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {authorDisplay}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {charCount} chars
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {createdDate}
                </span>
                {challenge.timesCompleted > 0 && (
                  <span>Practiced {challenge.timesCompleted} times</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <VoteButtons
                challengeId={challenge.id}
                initialVotes={challenge.votes ?? { upvotes: 0, downvotes: 0, score: 0 }}
                initialUserVote={0}
              />
              <ForkButton challengeId={challenge.id} variant="compact" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
