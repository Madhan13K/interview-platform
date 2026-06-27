package com.interview_platform_backend.interview_platform_backend.internalmobility.controller;

import com.interview_platform_backend.interview_platform_backend.internalmobility.entity.InternalApplication;
import com.interview_platform_backend.interview_platform_backend.internalmobility.entity.InternalJobPosting;
import com.interview_platform_backend.interview_platform_backend.internalmobility.service.InternalMobilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/internal-mobility")
@RequiredArgsConstructor
public class InternalMobilityController {

    private final InternalMobilityService internalMobilityService;

    @PostMapping("/postings")
    public ResponseEntity<InternalJobPosting> createPosting(@RequestBody InternalJobPosting posting) {
        return ResponseEntity.ok(internalMobilityService.createPosting(posting));
    }

    @GetMapping("/postings")
    public ResponseEntity<List<InternalJobPosting>> listOpenPostings() {
        return ResponseEntity.ok(internalMobilityService.listOpenPostings());
    }

    @GetMapping("/postings/{id}")
    public ResponseEntity<InternalJobPosting> getPosting(@PathVariable UUID id) {
        InternalJobPosting posting = internalMobilityService.getPosting(id);
        if (posting == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(posting);
    }

    @PutMapping("/postings/{id}/close")
    public ResponseEntity<InternalJobPosting> closePosting(@PathVariable UUID id) {
        return ResponseEntity.ok(internalMobilityService.closePosting(id));
    }

    @PostMapping("/applications")
    public ResponseEntity<InternalApplication> apply(@RequestBody InternalApplication application) {
        return ResponseEntity.ok(internalMobilityService.apply(application));
    }

    @GetMapping("/applications/employee/{employeeId}")
    public ResponseEntity<List<InternalApplication>> getApplicationsByEmployee(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(internalMobilityService.getApplicationsByEmployee(employeeId));
    }

    @PutMapping("/applications/{id}/approve")
    public ResponseEntity<InternalApplication> approveByManager(@PathVariable UUID id, @RequestParam boolean approved) {
        return ResponseEntity.ok(internalMobilityService.approveByManager(id, approved));
    }
}
