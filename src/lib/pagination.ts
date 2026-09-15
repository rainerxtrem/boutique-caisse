export const DEFAULT_PAGE_SIZE = 25;

export function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

export function paginationSkipTake(page: number, pageSize = DEFAULT_PAGE_SIZE) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function totalPages(count: number, pageSize = DEFAULT_PAGE_SIZE) {
  return Math.max(1, Math.ceil(count / pageSize));
}
