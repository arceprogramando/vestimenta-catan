export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export function paginationToParams(pagination: PaginationState): { limit: number; offset: number } {
  return {
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
  };
}

export function createSearchParams(params: PaginationParams & Record<string, string | number | undefined>): URLSearchParams {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  return searchParams;
}
