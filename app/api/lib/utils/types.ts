import { StatusCodes } from 'http-status-codes';

type ResultFailure = { success: false; errors: string[]; status?: StatusCodes };

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

// Keyset pagination for reverse-chronological feeds, where new entries arrive at
// the top and offsets would duplicate rows across pages. Tables use Paginated;
// feeds use CursorPaginated (ADR 0041).
export type CursorPaginated<T> = {
  data: T[];
  meta: {
    nextCursor: string | null;
  };
};
