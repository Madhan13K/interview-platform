"use client";

import { useState, useEffect, useCallback } from "react";
import { questionService } from "@/services/question.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import {
  QuestionCategory,
  CreateQuestionRequest,
  QuestionDifficulty,
  InterviewType,
  QuestionResponse,
} from "@/types";

const DIFFICULTIES: QuestionDifficulty[] = ["EASY", "MEDIUM", "HARD"];
const QUESTION_TYPES = [
  "TECHNICAL",
  "BEHAVIORAL",
  "SITUATIONAL",
  "CASE_STUDY",
  "CODING",
];

const difficultyColor: Record<QuestionDifficulty, string> = {
  EASY: "bg-green-100 text-green-800 border-green-300",
  MEDIUM: "bg-amber-100 text-amber-800 border-amber-300",
  HARD: "bg-red-100 text-red-800 border-red-300",
};

export default function QuestionBankPage() {
  // Data state
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Expand state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create Question Dialog state
  const [createQuestionOpen, setCreateQuestionOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState<CreateQuestionRequest>({
    text: "",
    type: "TECHNICAL",
    difficulty: "MEDIUM",
    categoryId: "",
    expectedAnswer: "",
    tags: [],
  });
  const [tagsInput, setTagsInput] = useState("");

  // Create Category Dialog state
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const data = await questionService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  // Fetch questions
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        size: pageSize,
      };
      if (searchKeyword) params.keyword = searchKeyword;
      if (difficultyFilter) params.difficulty = difficultyFilter;
      if (typeFilter) params.type = typeFilter;
      if (selectedCategory) params.categoryId = selectedCategory;

      const data = await questionService.search(params);
      setQuestions(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchKeyword, difficultyFilter, typeFilter, selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Handlers
  const handleCreateQuestion = async () => {
    try {
      const payload: CreateQuestionRequest = {
        ...newQuestion,
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      await questionService.create(payload);
      setCreateQuestionOpen(false);
      setNewQuestion({
        text: "",
        type: "TECHNICAL",
        difficulty: "MEDIUM",
        categoryId: "",
        expectedAnswer: "",
        tags: [],
      });
      setTagsInput("");
      fetchQuestions();
    } catch (error) {
      console.error("Failed to create question:", error);
    }
  };

  const handleCreateCategory = async () => {
    try {
      await questionService.createCategory(newCategory);
      setCreateCategoryOpen(false);
      setNewCategory({ name: "", description: "" });
      fetchCategories();
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await questionService.delete(id);
      fetchQuestions();
    } catch (error) {
      console.error("Failed to delete question:", error);
    }
  };

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Question Bank</h1>
        <div className="flex gap-2">
          <Dialog open={createCategoryOpen} onOpenChange={setCreateCategoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-50">
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cat-name">Name</Label>
                  <Input
                    id="cat-name"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                    placeholder="e.g. Data Structures"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-desc">Description</Label>
                  <Textarea
                    id="cat-desc"
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, description: e.target.value })
                    }
                    placeholder="Describe this category..."
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleCreateCategory}
                  disabled={!newCategory.name.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={createQuestionOpen} onOpenChange={setCreateQuestionOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Question</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="q-text">Question Text</Label>
                  <Textarea
                    id="q-text"
                    value={newQuestion.text}
                    onChange={(e) =>
                      setNewQuestion({ ...newQuestion, text: e.target.value })
                    }
                    placeholder="Enter the question..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newQuestion.type}
                      onValueChange={(val) =>
                        setNewQuestion({ ...newQuestion, type: val as InterviewType })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUESTION_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select
                      value={newQuestion.difficulty}
                      onValueChange={(val) =>
                        setNewQuestion({
                          ...newQuestion,
                          difficulty: val as QuestionDifficulty,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newQuestion.categoryId}
                    onValueChange={(val) =>
                      setNewQuestion({ ...newQuestion, categoryId: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-answer">Expected Answer</Label>
                  <Textarea
                    id="q-answer"
                    value={newQuestion.expectedAnswer}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        expectedAnswer: e.target.value,
                      })
                    }
                    placeholder="Expected answer or hints..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-tags">Tags (comma-separated)</Label>
                  <Input
                    id="q-tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. arrays, sorting, algorithms"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleCreateQuestion}
                  disabled={!newQuestion.text.trim() || !newQuestion.categoryId}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Categories Sidebar */}
        <aside className="w-60 shrink-0">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-3 pt-0">
              <button
                onClick={() => handleCategoryClick(null)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  selectedCategory === null
                    ? "bg-indigo-100 text-indigo-800 font-medium"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                All Questions
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-indigo-100 text-indigo-800 font-medium"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
              {categories.length === 0 && (
                <p className="px-3 py-2 text-xs text-slate-400">
                  No categories yet
                </p>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Filter Bar */}
          <Card className="border-slate-200">
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <Input
                placeholder="Search questions..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setPage(0);
                }}
                className="max-w-xs"
              />
              <Select
                value={difficultyFilter}
                onValueChange={(val) => {
                  setDifficultyFilter(val === "ALL" ? "" : val);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Difficulties</SelectItem>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={typeFilter}
                onValueChange={(val) => {
                  setTypeFilter(val === "ALL" ? "" : val);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  {QUESTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="ml-auto text-sm text-slate-500">
                {totalElements} question{totalElements !== 1 ? "s" : ""}
              </span>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-slate-200">
                  <CardContent className="p-4">
                    <Skeleton className="mb-2 h-5 w-3/4" />
                    <Skeleton className="mb-3 h-4 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && questions.length === 0 && (
            <Card className="border-slate-200">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="mb-3 text-4xl text-slate-300">?</div>
                <h3 className="text-lg font-medium text-slate-700">
                  No questions found
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try adjusting your filters or add a new question.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Questions List */}
          {!loading && questions.length > 0 && (
            <div className="space-y-3">
              {questions.map((question) => (
                <Card
                  key={question.id}
                  className="border-slate-200 transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <button
                          onClick={() =>
                            setExpandedId(
                              expandedId === question.id ? null : question.id
                            )
                          }
                          className="text-left"
                        >
                          <p className="font-medium text-slate-900">
                            {expandedId === question.id
                              ? question.text
                              : question.text.length > 150
                              ? question.text.slice(0, 150) + "..."
                              : question.text}
                          </p>
                        </button>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs font-medium text-indigo-700 border-indigo-300 bg-indigo-50"
                          >
                            {question.type}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium ${
                              difficultyColor[question.difficulty as QuestionDifficulty]
                            }`}
                          >
                            {question.difficulty}
                          </Badge>
                          {question.categoryName && (
                            <Badge
                              variant="outline"
                              className="text-xs text-slate-600 border-slate-300"
                            >
                              {question.categoryName}
                            </Badge>
                          )}
                          {question.tags &&
                            question.tags.map((tag: string) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs bg-slate-100 text-slate-600"
                              >
                                {tag}
                              </Badge>
                            ))}
                        </div>

                        {/* Expanded Content */}
                        {expandedId === question.id && (
                          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                            {question.expectedAnswer ? (
                              <div>
                                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                                  Expected Answer / Hints
                                </p>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                  {question.expectedAnswer}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm italic text-slate-400">
                                No expected answer provided.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-indigo-600"
                          onClick={() =>
                            setExpandedId(
                              expandedId === question.id ? null : question.id
                            )
                          }
                        >
                          {expandedId === question.id ? "Collapse" : "Expand"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-indigo-600"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-red-600"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
