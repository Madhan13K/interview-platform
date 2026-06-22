package com.interview_platform_backend.interview_platform_backend.exportimport;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Sprint 3: Export/Import Excel Format Tests
 */
@DisplayName("Excel Export/Import Tests")
class ExcelExportImportTest {

    @Test
    @DisplayName("Should generate valid XLSX file")
    void shouldGenerateValidXlsx() throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Test");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Name");
            header.createCell(1).setCellValue("Email");
            Row data = sheet.createRow(1);
            data.createCell(0).setCellValue("John");
            data.createCell(1).setCellValue("john@test.com");
            workbook.write(out);

            byte[] bytes = out.toByteArray();
            assertTrue(bytes.length > 0);

            // Verify we can read it back
            try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
                Sheet s = wb.getSheetAt(0);
                assertEquals("Name", s.getRow(0).getCell(0).getStringCellValue());
                assertEquals("john@test.com", s.getRow(1).getCell(1).getStringCellValue());
            }
        }
    }

    @Test
    @DisplayName("Should read header row for column mapping")
    void shouldReadHeaderRow() throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Candidates");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("firstName");
            header.createCell(1).setCellValue("lastName");
            header.createCell(2).setCellValue("email");
            workbook.write(out);

            try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(out.toByteArray()))) {
                Row h = wb.getSheetAt(0).getRow(0);
                assertEquals("firstName", h.getCell(0).getStringCellValue());
                assertEquals("lastName", h.getCell(1).getStringCellValue());
                assertEquals("email", h.getCell(2).getStringCellValue());
            }
        }
    }
}
