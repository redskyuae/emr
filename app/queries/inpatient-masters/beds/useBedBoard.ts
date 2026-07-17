import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetBedBoardResponse } from '@/app/api/v1/beds/board/types';

export const BED_BOARD_KEY = ['beds', 'board'] as const;

async function fetchBedBoard(): Promise<GetBedBoardResponse> {
  const response = await fetch('/api/v1/beds/board', { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load the Bed Board');
  }

  return response.json() as Promise<GetBedBoardResponse>;
}

function transformBedBoardResponse(response: GetBedBoardResponse) {
  return response.data;
}

// Non-suspense: the board polls-and-refreshes after every admission mutation,
// and a refresh must not blow away the surrounding toolbar and chrome.
export function useBedBoardQuery() {
  return useQuery({
    queryKey: BED_BOARD_KEY,
    queryFn: fetchBedBoard,
    select: transformBedBoardResponse,
  });
}
