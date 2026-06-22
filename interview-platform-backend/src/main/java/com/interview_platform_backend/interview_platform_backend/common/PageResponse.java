package com.interview_platform_backend.interview_platform_backend.common;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Standardized pagination response wrapper.
 * All paginated endpoints should return this format for consistency.
 * 
 * Usage in controllers:
 * <pre>
 * {@code
 * Page<Entity> page = repository.findAll(PageRequest.of(pageNum, pageSize));
 * return ResponseEntity.ok(PageResponse.from(page));
 * }
 * </pre>
 * 
 * For converting existing List endpoints to paginated:
 * <pre>
 * {@code
 * @GetMapping("/paginated")
 * public ResponseEntity<PageResponse<MyDto>> getPaginated(
 *     @RequestParam(defaultValue = "0") int page,
 *     @RequestParam(defaultValue = "20") int size,
 *     @RequestParam(defaultValue = "createdAt") String sortBy,
 *     @RequestParam(defaultValue = "desc") String sortDir) {
 *     
 *     Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(sortDir), sortBy));
 *     Page<Entity> result = repository.findAll(pageable);
 *     return ResponseEntity.ok(PageResponse.from(result.map(this::toDto)));
 * }
 * }
 * </pre>
 */
@Data
@Builder
public class PageResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;
    private boolean empty;

    /**
     * Create a PageResponse from a Spring Data Page object.
     */
    public static <T> PageResponse<T> from(Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .empty(page.isEmpty())
                .build();
    }

    /**
     * Create a PageResponse from a list (when you already have all items).
     * This is useful for backward compatibility when migrating List endpoints.
     */
    public static <T> PageResponse<T> fromList(List<T> items, int page, int size) {
        int totalElements = items.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);
        List<T> pageContent = items.subList(fromIndex, toIndex);

        return PageResponse.<T>builder()
                .content(pageContent)
                .page(page)
                .size(size)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .first(page == 0)
                .last(page >= totalPages - 1)
                .empty(pageContent.isEmpty())
                .build();
    }
}
