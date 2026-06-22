package com.interview_platform_backend.interview_platform_backend.document.scanning;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

/**
 * File Virus Scanning Service using ClamAV.
 * Scans uploaded documents for malware before S3 storage.
 * 
 * ClamAV communicates over TCP (default port 3310).
 * Uses INSTREAM command to scan file content without writing to disk.
 * 
 * Config:
 * - app.virus-scan.enabled=true
 * - app.virus-scan.clamav.host=localhost
 * - app.virus-scan.clamav.port=3310
 * - app.virus-scan.clamav.timeout-ms=30000
 * 
 * Docker (for dev):
 *   docker run -d --name clamav -p 3310:3310 clamav/clamav:latest
 */
@Service
public class VirusScanService {

    private static final Logger log = LoggerFactory.getLogger(VirusScanService.class);

    @Value("${app.virus-scan.enabled:false}")
    private boolean scanEnabled;

    @Value("${app.virus-scan.clamav.host:localhost}")
    private String clamavHost;

    @Value("${app.virus-scan.clamav.port:3310}")
    private int clamavPort;

    @Value("${app.virus-scan.clamav.timeout-ms:30000}")
    private int timeoutMs;

    /**
     * Scan a file for viruses/malware.
     * 
     * @param inputStream The file content to scan
     * @param fileName The original file name (for logging)
     * @return ScanResult indicating clean or infected
     * @throws VirusDetectedException if malware is found
     */
    public ScanResult scan(InputStream inputStream, String fileName) {
        if (!scanEnabled) {
            log.debug("Virus scanning disabled. Skipping scan for: {}", fileName);
            return new ScanResult(true, "SCAN_DISABLED", null);
        }

        log.info("Scanning file for viruses: {}", fileName);

        try (Socket socket = new Socket(clamavHost, clamavPort)) {
            socket.setSoTimeout(timeoutMs);

            OutputStream out = socket.getOutputStream();
            InputStream in = socket.getInputStream();

            // Send INSTREAM command
            out.write("zINSTREAM\0".getBytes(StandardCharsets.UTF_8));
            out.flush();

            // Stream file content in chunks
            byte[] buffer = new byte[8192];
            int bytesRead;
            long totalBytes = 0;

            while ((bytesRead = inputStream.read(buffer)) != -1) {
                // ClamAV expects: 4-byte big-endian chunk size + chunk data
                out.write(intToBytes(bytesRead));
                out.write(buffer, 0, bytesRead);
                out.flush();
                totalBytes += bytesRead;
            }

            // Send zero-length chunk to signal end of stream
            out.write(intToBytes(0));
            out.flush();

            // Read response
            StringBuilder response = new StringBuilder();
            int b;
            while ((b = in.read()) != -1 && b != 0) {
                response.append((char) b);
            }

            String result = response.toString().trim();
            log.info("ClamAV scan result for '{}' ({} bytes): {}", fileName, totalBytes, result);

            if (result.contains("OK")) {
                return new ScanResult(true, "CLEAN", null);
            } else if (result.contains("FOUND")) {
                String virusName = result.replaceAll(".*stream: (.*) FOUND.*", "$1").trim();
                log.error("VIRUS DETECTED in file '{}': {}", fileName, virusName);
                throw new VirusDetectedException(fileName, virusName);
            } else {
                log.warn("Unexpected ClamAV response for '{}': {}", fileName, result);
                return new ScanResult(true, "SCAN_ERROR_ALLOWED", result);
            }

        } catch (VirusDetectedException e) {
            throw e; // Re-throw virus exceptions
        } catch (java.net.ConnectException e) {
            log.error("Cannot connect to ClamAV at {}:{}. Is the service running?", clamavHost, clamavPort);
            // Fail open or fail closed based on policy
            return new ScanResult(true, "SCANNER_UNAVAILABLE", "ClamAV connection refused");
        } catch (Exception e) {
            log.error("Virus scan failed for '{}': {}", fileName, e.getMessage());
            // Fail open: allow upload if scanner is unavailable
            return new ScanResult(true, "SCAN_ERROR", e.getMessage());
        }
    }

    /**
     * Check if ClamAV service is available.
     */
    public boolean isAvailable() {
        if (!scanEnabled) return false;
        try (Socket socket = new Socket(clamavHost, clamavPort)) {
            socket.setSoTimeout(5000);
            OutputStream out = socket.getOutputStream();
            out.write("zPING\0".getBytes(StandardCharsets.UTF_8));
            out.flush();

            InputStream in = socket.getInputStream();
            StringBuilder response = new StringBuilder();
            int b;
            while ((b = in.read()) != -1 && b != 0) {
                response.append((char) b);
            }
            return response.toString().trim().contains("PONG");
        } catch (Exception e) {
            return false;
        }
    }

    private byte[] intToBytes(int value) {
        return new byte[]{
                (byte) (value >> 24),
                (byte) (value >> 16),
                (byte) (value >> 8),
                (byte) value
        };
    }

    public record ScanResult(boolean allowed, String status, String details) {}

    public static class VirusDetectedException extends RuntimeException {
        private final String fileName;
        private final String virusName;

        public VirusDetectedException(String fileName, String virusName) {
            super("Virus detected in file '" + fileName + "': " + virusName);
            this.fileName = fileName;
            this.virusName = virusName;
        }

        public String getFileName() { return fileName; }
        public String getVirusName() { return virusName; }
    }
}
