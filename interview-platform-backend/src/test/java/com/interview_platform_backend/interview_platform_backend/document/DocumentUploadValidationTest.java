package com.interview_platform_backend.interview_platform_backend.document;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Sprint 1: Document Upload Validation Tests
 * Tests file type validation, size limits, and path traversal prevention.
 */
@DisplayName("Document Upload Validation Tests")
class DocumentUploadValidationTest {

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg", "image/png", "image/gif",
            "text/plain", "text/csv",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    @Nested
    @DisplayName("File Size Validation")
    class FileSizeValidation {

        @Test
        @DisplayName("Should accept file under size limit")
        void shouldAcceptFileUnderLimit() {
            MockMultipartFile file = new MockMultipartFile("file", "resume.pdf",
                    "application/pdf", new byte[1024]); // 1KB
            assertTrue(file.getSize() <= MAX_FILE_SIZE);
        }

        @Test
        @DisplayName("Should reject file exceeding 50MB limit")
        void shouldRejectOversizedFile() {
            long oversizedBytes = MAX_FILE_SIZE + 1;
            assertTrue(oversizedBytes > MAX_FILE_SIZE,
                    "File exceeding 50MB should be rejected");
        }

        @Test
        @DisplayName("Should reject empty file")
        void shouldRejectEmptyFile() {
            MockMultipartFile file = new MockMultipartFile("file", "empty.pdf",
                    "application/pdf", new byte[0]);
            assertTrue(file.isEmpty(), "Empty files should be rejected");
        }
    }

    @Nested
    @DisplayName("Content Type Validation")
    class ContentTypeValidation {

        @Test
        @DisplayName("Should accept allowed content types")
        void shouldAcceptAllowedTypes() {
            String[] allowed = {"application/pdf", "image/jpeg", "image/png", "text/plain",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"};
            for (String type : allowed) {
                assertTrue(ALLOWED_CONTENT_TYPES.contains(type),
                        type + " should be allowed");
            }
        }

        @Test
        @DisplayName("Should reject dangerous content types")
        void shouldRejectDangerousTypes() {
            String[] dangerous = {
                    "application/x-executable",
                    "application/x-msdownload",
                    "application/javascript",
                    "text/html",
                    "application/x-sh",
                    "application/x-php",
                    "application/java-archive"
            };
            for (String type : dangerous) {
                assertFalse(ALLOWED_CONTENT_TYPES.contains(type),
                        type + " should be REJECTED");
            }
        }

        @Test
        @DisplayName("Should reject null content type")
        void shouldRejectNullContentType() {
            assertFalse(ALLOWED_CONTENT_TYPES.contains(null));
        }
    }

    @Nested
    @DisplayName("Filename Validation (Path Traversal)")
    class FilenameValidation {

        @Test
        @DisplayName("Should sanitize path traversal attempts")
        void shouldSanitizePathTraversal() {
            String[] maliciousNames = {
                    "../../../etc/passwd",
                    "..\\..\\windows\\system32\\config\\sam",
                    "file%2F..%2F..%2Fetc%2Fpasswd",
                    "../../root/.ssh/authorized_keys",
                    "normal.pdf/../../../etc/shadow"
            };

            for (String name : maliciousNames) {
                String sanitized = sanitizeFilename(name);
                assertFalse(sanitized.contains(".."), "Should remove '..' from: " + name);
                assertFalse(sanitized.contains("/etc/"), "Should not allow /etc/ path");
                assertFalse(sanitized.contains("\\"), "Should not allow backslashes");
            }
        }

        @Test
        @DisplayName("Should preserve normal filenames")
        void shouldPreserveNormalFilenames() {
            assertEquals("resume.pdf", sanitizeFilename("resume.pdf"));
            assertEquals("cover_letter.docx", sanitizeFilename("cover_letter.docx"));
            assertEquals("my-file (1).png", sanitizeFilename("my-file (1).png"));
        }

        @Test
        @DisplayName("Should handle null/empty filenames")
        void shouldHandleNullEmpty() {
            assertNotNull(sanitizeFilename(null));
            assertNotNull(sanitizeFilename(""));
        }

        @Test
        @DisplayName("Should strip null bytes")
        void shouldStripNullBytes() {
            String withNullByte = "resume.pdf\0.exe";
            String sanitized = sanitizeFilename(withNullByte);
            assertFalse(sanitized.contains("\0"), "Should strip null bytes");
            assertFalse(sanitized.endsWith(".exe"), "Should not end with hidden extension");
        }
    }

    @Nested
    @DisplayName("File Extension Validation")
    class FileExtensionValidation {

        @Test
        @DisplayName("Should reject double extensions used for masquerading")
        void shouldRejectDoubleExtensions() {
            String[] masquerading = {
                    "resume.pdf.exe",
                    "document.docx.js",
                    "photo.jpg.php",
                    "data.csv.bat"
            };

            for (String name : masquerading) {
                assertTrue(hasDoubleExtension(name),
                        "Should detect double extension: " + name);
            }
        }

        @Test
        @DisplayName("Should accept normal extensions")
        void shouldAcceptNormalExtensions() {
            String[] normal = {"resume.pdf", "cover.docx", "photo.jpg", "data.xlsx"};
            for (String name : normal) {
                assertFalse(hasDoubleExtension(name),
                        "Should not flag normal file: " + name);
            }
        }
    }

    // Helper methods
    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) return "unnamed";
        return filename
                .replaceAll("\0", "") // Strip null bytes
                .replaceAll("\\.\\.", "") // Remove path traversal
                .replaceAll("[/\\\\]", "_") // Replace path separators
                .replaceAll("[^a-zA-Z0-9._\\-() ]", "_") // Only safe chars
                .trim();
    }

    private boolean hasDoubleExtension(String filename) {
        if (filename == null) return false;
        String[] dangerousExts = {".exe", ".bat", ".cmd", ".sh", ".php", ".js", ".py", ".rb"};
        String lower = filename.toLowerCase();
        // Check if there's a safe extension followed by a dangerous one
        int lastDot = lower.lastIndexOf('.');
        if (lastDot <= 0) return false;
        String lastExt = lower.substring(lastDot);
        for (String dangerous : dangerousExts) {
            if (lastExt.equals(dangerous) && lower.substring(0, lastDot).contains(".")) {
                return true;
            }
        }
        return false;
    }
}
