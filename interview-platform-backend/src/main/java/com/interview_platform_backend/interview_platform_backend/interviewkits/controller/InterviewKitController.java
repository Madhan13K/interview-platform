package com.interview_platform_backend.interview_platform_backend.interviewkits.controller;

import com.interview_platform_backend.interview_platform_backend.interviewkits.entity.InterviewKit;
import com.interview_platform_backend.interview_platform_backend.interviewkits.service.InterviewKitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/interview-kits")
@RequiredArgsConstructor
public class InterviewKitController {

    private final InterviewKitService interviewKitService;

    @PostMapping
    public ResponseEntity<InterviewKit> create(@RequestBody InterviewKit kit) {
        return ResponseEntity.ok(interviewKitService.create(kit));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InterviewKit> getById(@PathVariable UUID id) {
        InterviewKit kit = interviewKitService.getById(id);
        if (kit == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(kit);
    }

    @GetMapping
    public ResponseEntity<List<InterviewKit>> listAll(@RequestParam(required = false) String roleType) {
        if (roleType != null && !roleType.isBlank()) {
            return ResponseEntity.ok(interviewKitService.listByRole(roleType));
        }
        return ResponseEntity.ok(interviewKitService.listAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<InterviewKit> update(@PathVariable UUID id, @RequestBody InterviewKit kit) {
        return ResponseEntity.ok(interviewKitService.update(id, kit));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        interviewKitService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable UUID id) {
        byte[] pdf = interviewKitService.generatePdf(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment().filename("interview-kit-" + id + ".pdf").build());
        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }
}
