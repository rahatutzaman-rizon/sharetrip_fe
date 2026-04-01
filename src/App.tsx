import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { api } from './services/api';
import type { Product } from './types/product';

const PAGE_SIZE = 12;
const CATEGORY_OPTIONS = ['Electronics', 'Clothing', 'Home', 'Outdoors'];

function useDebouncedValue<T>(value: T, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

const ProductCard = memo(function ProductCard({
  product,
}: {
  product: Product;
}) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      <div className="space-y-3 p-4">
        <p className="text-sm font-medium text-slate-500">{product.category}</p>

        <h3 className="line-clamp-2 min-h-[56px] text-lg font-semibold leading-7 text-slate-900">
          {product.name}
        </h3>

        <p className="line-clamp-2 min-h-[48px] text-sm leading-6 text-slate-600">
          {product.description}
        </p>

        <div className="flex items-center justify-between pt-1">
          <span className="text-3xl font-bold tracking-tight text-blue-600">
            ${product.price}
          </span>

          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              product.stock > 0
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </span>
        </div>
      </div>
    </article>
  );
});

const ProductSkeletonCard = memo(function ProductSkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="aspect-[4/3] animate-pulse bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
        <div className="h-6 w-4/5 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
});

const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  disabled,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('left-ellipsis');
  }

  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) pages.push('right-ellipsis');
    pages.push(totalPages);
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>

      {pages.map((page, index) =>
        typeof page === 'string' ? (
          <span
            key={`${page}-${index}`}
            className="px-2 py-2 text-sm text-slate-400"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            disabled={disabled}
            aria-current={page === currentPage ? 'page' : undefined}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
});

export default function App() {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(searchInput, 450);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category]);

  const queryKey = useMemo(
    () => ['products', { page, limit: PAGE_SIZE, category, search: debouncedSearch }],
    [page, category, debouncedSearch]
  );

  const {
    data,
    error,
    isLoading,
    isFetching,
    isPlaceholderData,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () =>
      api.fetchProducts({
        page,
        limit: PAGE_SIZE,
        category: category || undefined,
        search: debouncedSearch || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const products = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? page;

  useEffect(() => {
    if (!data) return;

    if (currentPage < totalPages) {
      queryClient.prefetchQuery({
        queryKey: [
          'products',
          {
            page: currentPage + 1,
            limit: PAGE_SIZE,
            category,
            search: debouncedSearch,
          },
        ],
        queryFn: () =>
          api.fetchProducts({
            page: currentPage + 1,
            limit: PAGE_SIZE,
            category: category || undefined,
            search: debouncedSearch || undefined,
          }),
      });
    }
  }, [queryClient, data, currentPage, totalPages, category, debouncedSearch]);

  const pageLabel = useMemo(() => {
    if (total === 0) return 'No products found';
    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, total);
    return `Showing ${start}-${end} of ${total} products`;
  }, [currentPage, total]);

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) return;
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setCategory('');
    setPage(1);
  };

  const handleHardRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['products'] });
    refetch();
  };

  const showInitialLoading = isLoading && !data;
  const showRefreshing = isFetching && !!data;
  const showErrorState = !!error && !data;
  const showTopWarning = !!error && !!data;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-8 text-white shadow-xl sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
                Product Listing
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Premium product grid
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Cached, paginated, and resilient UI for a slow and flaky API.
              </p>
            </div>

            {showRefreshing && (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-slate-200 backdrop-blur">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating products...
              </div>
            )}
          </div>
        </header>

        <section className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:grid-cols-[1fr_220px_auto]">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-blue-500 focus-within:bg-white">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              aria-label="Search products"
            />
          </label>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
          >
            <option value="">All categories</option>
            {CATEGORY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button
            onClick={handleHardRefresh}
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </section>

        {showTopWarning && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Refresh failed</p>
              <p>{error instanceof Error ? error.message : 'Unable to refresh products.'}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
            >
              Retry
            </button>
          </div>
        )}

        <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">{pageLabel}</p>
            <p className="mt-1 text-xs text-slate-500">
              Page {currentPage} of {Math.max(totalPages, 1)}
              {isPlaceholderData ? ' • loading next page...' : ''}
            </p>
          </div>

          {(searchInput || category) && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}
        </section>

        {showInitialLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <ProductSkeletonCard key={index} />
            ))}
          </div>
        ) : showErrorState ? (
          <div className="rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              Failed to load products
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
              {error instanceof Error
                ? error.message
                : 'Something went wrong while fetching products.'}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">No products found</h2>
            <p className="mt-2 text-sm text-slate-600">
              Try a different search keyword or category.
            </p>
          </div>
        ) : (
          <>
            <main className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </main>

            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                disabled={isFetching}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}