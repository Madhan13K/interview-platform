import api from "@/lib/axios";
import { JOB_BOARD_ENDPOINTS } from "@/lib/api-endpoints";

export interface JobPostingRequest {
  title: string;
  description: string;
  location: string;
  employmentType: string;
  salaryRange?: string;
  applyUrl: string;
}

export interface PostingResult {
  board: string;
  success: boolean;
  postingId: string | null;
  errorMessage: string | null;
}

export const jobBoardService = {
  postToAll: async (data: JobPostingRequest): Promise<Record<string, PostingResult>> => {
    const res = await api.post(JOB_BOARD_ENDPOINTS.postToAll, data);
    return res.data;
  },

  postToBoard: async (board: string, data: JobPostingRequest): Promise<PostingResult> => {
    const res = await api.post(JOB_BOARD_ENDPOINTS.postToBoard(board), data);
    return res.data;
  },
};
