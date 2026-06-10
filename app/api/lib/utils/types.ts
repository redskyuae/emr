type ResultFailure = { success: false; errors: string[]; status?: number };

export type ValidationResult<T> = { success: true; data: T } | ResultFailure;

export type CommandResult<T> = { success: true; data: T } | ResultFailure;

export type SingleQueryResult<T> = { success: true; data: T } | ResultFailure;

export type ListQueryResult<T> = { success: true; data: T[]; total: number } | ResultFailure;

export type QueryResult<T> = SingleQueryResult<T> | ListQueryResult<T>;

export type Paginated<T> = {
  data: T[];
  meta: {
    total: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
  };
};
