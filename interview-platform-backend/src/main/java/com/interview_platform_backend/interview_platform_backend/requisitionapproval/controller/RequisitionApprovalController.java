package com.interview_platform_backend.interview_platform_backend.requisitionapproval.controller;

import com.interview_platform_backend.interview_platform_backend.requisitionapproval.entity.Requisition;
import com.interview_platform_backend.interview_platform_backend.requisitionapproval.service.RequisitionApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/requisitions")
@RequiredArgsConstructor
public class RequisitionApprovalController {

    private final RequisitionApprovalService requisitionApprovalService;

    @PostMapping
    public ResponseEntity<Requisition> submitRequisition(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<String> approverChainStr = (List<String>) request.get("approvalChain");
        List<UUID> approverChain = approverChainStr != null
                ? approverChainStr.stream().map(UUID::fromString).collect(Collectors.toList())
                : List.of();

        Requisition requisition = requisitionApprovalService.submitRequisition(
                (String) request.get("jobTitle"),
                (String) request.get("department"),
                UUID.fromString((String) request.get("requestedBy")),
                ((Number) request.get("headcount")).intValue(),
                (String) request.get("justification"),
                (String) request.get("budgetImpact"),
                approverChain
        );
        return ResponseEntity.ok(requisition);
    }

    @PostMapping("/{requisitionId}/approve")
    public ResponseEntity<Requisition> approve(
            @PathVariable UUID requisitionId,
            @RequestParam UUID approverId) {
        Requisition requisition = requisitionApprovalService.approve(requisitionId, approverId);
        return ResponseEntity.ok(requisition);
    }

    @PostMapping("/{requisitionId}/reject")
    public ResponseEntity<Requisition> reject(
            @PathVariable UUID requisitionId,
            @RequestParam UUID approverId) {
        Requisition requisition = requisitionApprovalService.reject(requisitionId, approverId);
        return ResponseEntity.ok(requisition);
    }

    @PostMapping("/{requisitionId}/escalate")
    public ResponseEntity<Requisition> escalate(
            @PathVariable UUID requisitionId,
            @RequestParam UUID newApproverId) {
        Requisition requisition = requisitionApprovalService.escalate(requisitionId, newApproverId);
        return ResponseEntity.ok(requisition);
    }

    @GetMapping("/pending/{approverId}")
    public ResponseEntity<List<Requisition>> getMyPendingApprovals(@PathVariable UUID approverId) {
        List<Requisition> pending = requisitionApprovalService.getMyPendingApprovals(approverId);
        return ResponseEntity.ok(pending);
    }

    @GetMapping("/department/{department}")
    public ResponseEntity<List<Requisition>> getByDepartment(@PathVariable String department) {
        List<Requisition> requisitions = requisitionApprovalService.getByDepartment(department);
        return ResponseEntity.ok(requisitions);
    }
}
