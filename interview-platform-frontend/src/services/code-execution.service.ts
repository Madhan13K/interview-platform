import api from "@/lib/axios";
import { CODE_EXECUTION_ENDPOINTS } from "@/lib/api-endpoints";

export interface CodeExecutionRequest {
  language: string;
  code: string;
  stdin?: string;
  timeout?: number;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface CodeExecutionWithTestsRequest {
  language: string;
  code: string;
  testCases: TestCase[];
  timeout?: number;
}

export interface CodeExecutionResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  memoryUsed?: number;
}

export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTime: number;
}

export interface CodeExecutionWithTestsResponse {
  results: TestCaseResult[];
  totalPassed: number;
  totalFailed: number;
  totalExecutionTime: number;
}

export const codeExecutionService = {
  execute: async (data: CodeExecutionRequest): Promise<CodeExecutionResponse> => {
    const res = await api.post(CODE_EXECUTION_ENDPOINTS.execute, data);
    return res.data;
  },

  executeWithTestCases: async (data: CodeExecutionWithTestsRequest): Promise<CodeExecutionWithTestsResponse> => {
    const res = await api.post(CODE_EXECUTION_ENDPOINTS.executeWithTestCases, data);
    return res.data;
  },
};
