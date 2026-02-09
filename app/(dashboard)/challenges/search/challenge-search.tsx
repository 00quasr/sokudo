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
  FileText,
  Flame,
  Filter,
  X,
} from 'lucide-react';
import Link from 'next/link';

interface ChallengeResult {
  id: number;
  content: string;
  difficulty: string;
  syntaxType: string;
  hint: string | null;
  avgWpm: number;
  timesCompleted: number;
  createdAt: string | Date;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  categoryIcon: string | null;
}

interface CategoryOption {
  slug: string;
  name: string;
  icon: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface SearchData {
  challenges: ChallengeResult[];
  pagination: Pagination;
  categories: CategoryOption[];
}

type SortBy = 'timesCompleted' | 'avgWpm' | 'createdAt' | 'difficulty';
type Difficulty = 'beginner' | 'intermediate' | 'advanced';

const sortOptions: { value: SortBy; label: string }[] = [
  { value: 'timesCompleted', label: 'Popular' },
  { value: 'avgWpm', label: 'Avg WPM' },
  { value: 'createdAt', label: 'Newest' },
];

const difficultyOptions: { value: Difficulty; label: string; color: string }[] = [
  { value: 'beginner', label: 'Beginner', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'advanced', label: 'Advanced', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-red-500/20 text-red-400',
};

export function ChallengeSearch({
  initialData,
}: {
  initialData: SearchData;
}) {
  const [data, setData] = useState<SearchData>(initialData);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('timesCompleted');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | ''>('');
  const [loading, setLoading] = useState(false);

  const fetchChallenges = useCallback(
    async (params: {
      page?: number;
      search?: string;
      sortBy?: SortBy;
      category?: string;
      difficulty?: string;
    }) => {
      setLoading(true);
      try {
        const searchParams = new URLSearchParams();
        searchParams.set('page', String(params.page ?? 1));
        searchParams.set('limit', '20');
        searchParams.set('sortBy', params.sortBy ?? sortBy);
        searchParams.set('sortOrder', (params.sortBy ?? sortBy) === 'createdAt' ? 'desc' : 'desc');
        if (params.search) {
          searchParams.set('search', params.search);
        }
        const cat = params.category ?? selectedCategory;
        if (cat) {
          searchParams.set('category', cat);
        }
        const diff = params.difficulty ?? selectedDifficulty;
        if (diff) {
          searchParams.set('difficulty', diff);
        }

        const res = await fetch(`/api/challenges/search?${searchParams}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    },
    [sortBy, selectedCategory, selectedDifficulty]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchChallenges({ page: 1, search, sortBy, category: selectedCategory, difficulty: selectedDifficulty });
  };

  const handleSortChange = (newSort: SortBy) => {
    setSortBy(newSort);
    fetchChallenges({ page: 1, search, sortBy: newSort, category: selectedCategory, difficulty: selectedDifficulty });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    fetchChallenges({ page: 1, search, sortBy, category, difficulty: selectedDifficulty });
  };

  const handleDifficultyChange = (difficulty: Difficulty | '') => {
    setSelectedDifficulty(difficulty);
    fetchChallenges({ page: 1, search, sortBy, category: selectedCategory, difficulty });
  };

  const handlePageChange = (page: number) => {
    fetchChallenges({ page, search, sortBy, category: selectedCategory, difficulty: selectedDifficulty });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedDifficulty('');
    setSortBy('timesCompleted');
    fetchChallenges({ page: 1, search: '', sortBy: 'timesCompleted', category: '', difficulty: '' });
  };

  const hasActiveFilters = search || selectedCategory || selectedDifficulty;

  return (
    <div>
      {/* Search bar */}
      <div className="flex flex-col gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              type="text"
              placeholder="Search challenges by content or hint..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Category filter */}
          <div className="flex flex-wrap gap-1">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange('')}
              className={selectedCategory === '' ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
            >
              <Filter className="h-3.5 w-3.5 mr-1" />
              All Categories
            </Button>
            {data.categories.map((cat) => (
              <Button
                key={cat.slug}
                variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryChange(cat.slug)}
                className={selectedCategory === cat.slug ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
              >
                {cat.name}
              </Button>
            ))}
          </div>

          {/* Difficulty filter */}
          <div className="flex gap-1">
            {difficultyOptions.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                size="sm"
                onClick={() => handleDifficultyChange(selectedDifficulty === option.value ? '' : option.value)}
                className={
                  selectedDifficulty === option.value
                    ? `${option.color} border`
                    : ''
                }
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* Sort options */}
          <div className="flex gap-1 ml-auto">
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

        {/* Active filters summary */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.1] px-2 py-0.5 text-xs text-white/70">
                &quot;{search}&quot;
                <button onClick={() => { setSearch(''); fetchChallenges({ page: 1, search: '', sortBy, category: selectedCategory, difficulty: selectedDifficulty }); }}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-400">
                {data.categories.find((c) => c.slug === selectedCategory)?.name}
                <button onClick={() => handleCategoryChange('')}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedDifficulty && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs capitalize ${difficultyColors[selectedDifficulty]}`}>
                {selectedDifficulty}
                <button onClick={() => handleDifficultyChange('')}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-white/50 hover:text-white/70 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-3">
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
            <Search className="h-12 w-12 text-white/40 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No challenges found
            </h3>
            <p className="text-sm text-white/50 max-w-sm">
              {hasActiveFilters
                ? 'Try adjusting your filters or search term.'
                : 'No challenges available yet.'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-white/50 mb-4">
            {data.pagination.total} challenge{data.pagination.total !== 1 ? 's' : ''} found
          </p>

          <div className="grid gap-3">
            {data.challenges.map((challenge) => (
              <ChallengeResultRow key={challenge.id} challenge={challenge} />
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

function ChallengeResultRow({ challenge }: { challenge: ChallengeResult }) {
  const preview =
    challenge.content.length > 120
      ? challenge.content.slice(0, 120) + '...'
      : challenge.content;

  const difficultyClass = difficultyColors[challenge.difficulty] || difficultyColors.beginner;

  return (
    <Link href={`/practice/${challenge.categorySlug}/${challenge.id}`}>
      <Card className="transition-all hover:border-orange-300 hover:shadow-md cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-white">
                  {challenge.categoryName}
                </span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${difficultyClass}`}>
                  {challenge.difficulty}
                </span>
              </div>
              <p className="font-mono text-sm text-white/60 line-clamp-2">
                {preview}
              </p>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-white/50">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {challenge.content.length} chars
                </span>
                {challenge.timesCompleted > 0 && (
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    Practiced {challenge.timesCompleted} times
                  </span>
                )}
                {challenge.avgWpm > 0 && (
                  <span>Avg {challenge.avgWpm} WPM</span>
                )}
                {challenge.hint && (
                  <span className="text-white/40 italic truncate max-w-xs">
                    Hint: {challenge.hint}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
