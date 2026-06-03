export type ValidationResult<T> = { success: true; data: T } | { success: false; errors: string[] };

export type CommandResult<T> = { success: true; data: T } | { success: false; errors: string[] };

export type QueryResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] }
  | { success: true; data: T[]; total: number };

export type Paginated<T> = {
  data: T[];
  meta: {
    total: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
  };
};
