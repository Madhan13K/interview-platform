package com.interview_platform_backend.interview_platform_backend.report;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.io.ByteArrayOutputStream;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Report/PDF Generation Tests")
class PdfGenerationTest {

    @Test void shouldGenerateNonEmptyPdf() throws Exception {
        byte[] pdf = generateSimplePdf("Test Report", "This is a test.");
        assertNotNull(pdf);
        assertTrue(pdf.length > 0);
        // PDF magic bytes: %PDF
        assertEquals('%', (char) pdf[0]);
        assertEquals('P', (char) pdf[1]);
        assertEquals('D', (char) pdf[2]);
        assertEquals('F', (char) pdf[3]);
    }

    @Test void shouldHandleLargeContent() throws Exception {
        StringBuilder content = new StringBuilder();
        for (int i = 0; i < 1000; i++) content.append("Row ").append(i).append(": data data data\n");
        byte[] pdf = generateSimplePdf("Large Report", content.toString());
        assertTrue(pdf.length > 1000);
    }

    @Test void shouldHandleSpecialCharacters() throws Exception {
        byte[] pdf = generateSimplePdf("Special Chars", "Résumé — André's café & naïve 日本語");
        assertNotNull(pdf);
        assertTrue(pdf.length > 0);
    }

    @Test void shouldHandleEmptyContent() throws Exception {
        byte[] pdf = generateSimplePdf("Empty Report", "");
        assertNotNull(pdf);
        assertTrue(pdf.length > 0, "Even empty PDF should have headers");
    }

    private byte[] generateSimplePdf(String title, String content) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        com.lowagie.text.Document document = new com.lowagie.text.Document();
        com.lowagie.text.pdf.PdfWriter.getInstance(document, baos);
        document.open();
        document.addTitle(title);
        document.add(new com.lowagie.text.Paragraph(title));
        if (content != null && !content.isEmpty()) {
            document.add(new com.lowagie.text.Paragraph(content));
        }
        document.close();
        return baos.toByteArray();
    }
}
