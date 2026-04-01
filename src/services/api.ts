import type {
  Product,
  PaginatedResponse,
  FetchProductsParams,
} from '../types/product';

const categories = ['Electronics', 'Clothing', 'Home', 'Outdoors'];

const mockProducts: Product[] = Array.from({ length: 154 }, (_, i) => ({
  id: `prod-${i + 1}`,
  name: `Premium Product ${i + 1}`,
  description: `This is a detailed description for Premium Product ${i + 1}. It features exceptional quality and design, perfect for modern needs.`,
  price: Math.floor(Math.random() * 500) + 50,
  category: categories[Math.floor(Math.random() * categories.length)],
  imageUrl: `https://picsum.photos/seed/${i + 1}/400/300`,
  stock: Math.floor(Math.random() * 50),
}));

type CacheEntry = {
  expiresAt: number;
  value: PaginatedResponse<Product>;
};

const RESPONSE_CACHE = new Map<string, CacheEntry>();
const IN_FLIGHT_REQUESTS = new Map<string, Promise<PaginatedResponse<Product>>>();

const CACHE_TTL_MS = 1000 * 60 * 5;

function buildCacheKey(params: Required<FetchProductsParams>) {
  return JSON.stringify(params);
}

function normalizeParams(params: FetchProductsParams = {}): Required<FetchProductsParams> {
  return {
    page: params.page ?? 1,
    limit: params.limit ?? 12,
    category: params.category?.trim() ?? '',
    search: params.search?.trim() ?? '',
  };
}

function getCachedValue(key: string) {
  const cached = RESPONSE_CACHE.get(key);
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    RESPONSE_CACHE.delete(key);
    return null;
  }

  return cached.value;
}

function setCachedValue(key: string, value: PaginatedResponse<Product>) {
  RESPONSE_CACHE.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

async function simulateSlowNetwork() {
  const delay = Math.floor(Math.random() * 2000) + 500;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

function buildResponse(params: Required<FetchProductsParams>): PaginatedResponse<Product> {
  const { page, limit, category, search } = params;

  let filteredData = mockProducts;

  if (category) {
    filteredData = filteredData.filter(
      (product) => product.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filteredData = filteredData.filter(
      (product) =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
    );
  }

  const total = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const startIndex = (safePage - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    total,
    page: safePage,
    limit,
    totalPages,
  };
}

export const api = {
  async fetchProducts(
    params: FetchProductsParams = {}
  ): Promise<PaginatedResponse<Product>> {
    const normalized = normalizeParams(params);
    const key = buildCacheKey(normalized);

    const cached = getCachedValue(key);
    if (cached) {
      return cached;
    }

    const existingRequest = IN_FLIGHT_REQUESTS.get(key);
    if (existingRequest) {
      return existingRequest;
    }

    const request = (async () => {
      await simulateSlowNetwork();

      if (Math.random() < 0.2) {
        throw new Error(
          'Network Error: Failed to fetch products. The server might be overloaded.'
        );
      }

      const response = buildResponse(normalized);
      setCachedValue(key, response);
      return response;
    })();

    IN_FLIGHT_REQUESTS.set(key, request);

    try {
      return await request;
    } finally {
      IN_FLIGHT_REQUESTS.delete(key);
    }
  },

  clearCache() {
    RESPONSE_CACHE.clear();
    IN_FLIGHT_REQUESTS.clear();
  },
};