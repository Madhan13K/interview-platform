package com.interview_platform_backend.interview_platform_backend.common;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Standardized pagination request parameters.
 * 
 * Usage in controllers:
 * <pre>
 * {@code
 * @GetMapping
 * public ResponseEntity<PageResponse<MyDto>> getAll(
 *     @RequestParam(defaultValue = "0") int page,
 *     @RequestParam(defaultValue = "20") int size,
 *     @RequestParam(defaultValue = "createdAt") String sortBy,
 *     @RequestParam(defaultValue = "desc") String sortDir) {
 *     
 *     Pageable pageable = PaginationUtil.toPageable(page, size, sortBy, sortDir);
 *     // ... use pageable with repository
 * }
 * }
 * </pre>
 * 
 * Defaults:
 * - page: 0 (first page)
 * - size: 20 (max 100)
 * - sortBy: "createdAt"
 * - sortDir: "desc" (newest first)
 */
public final class PaginationUtil {

    private PaginationUtil() {} // utility class

    public static final int DEFAULT_PAGE = 0;
    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;
    public static final String DEFAULT_SORT_BY = "createdAt";
    public static final String DEFAULT_SORT_DIR = "desc";

    /**
     * Create a Pageable from standard request parameters.
     * Enforces max page size of 100 to prevent performance issues.
     */
    public static Pageable toPageable(int page, int size, String sortBy, String sortDir) {
        int validPage = Math.max(0, page);
        int validSize = Math.min(Math.max(1, size), MAX_SIZE);
        String validSortBy = (sortBy != null && !sortBy.isBlank()) ? sortBy : DEFAULT_SORT_BY;
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;

        return PageRequest.of(validPage, validSize, Sort.by(direction, validSortBy));
    }

    /**
     * Create a Pageable with default sort (createdAt desc).
     */
    public static Pageable toPageable(int page, int size) {
        return toPageable(page, size, DEFAULT_SORT_BY, DEFAULT_SORT_DIR);
    }

    /**
     * Create a default Pageable (page 0, size 20, createdAt desc).
     */
    public static Pageable defaultPageable() {
        return toPageable(DEFAULT_PAGE, DEFAULT_SIZE);
    }
}
