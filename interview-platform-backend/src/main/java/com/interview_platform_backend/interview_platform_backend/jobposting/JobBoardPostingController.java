package com.interview_platform_backend.interview_platform_backend.jobposting;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/job-boards")
@PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
public class JobBoardPostingController {

    private final JobBoardPostingService jobBoardPostingService;

    public JobBoardPostingController(JobBoardPostingService jobBoardPostingService) {
        this.jobBoardPostingService = jobBoardPostingService;
    }

    @PostMapping("/post-all")
    public ResponseEntity<Map<String, JobBoardPostingService.PostingResult>> postToAll(
            @RequestBody JobBoardPostingService.JobPostingRequest request) {
        return ResponseEntity.ok(jobBoardPostingService.postToAllBoards(request));
    }

    @PostMapping("/post/{board}")
    public ResponseEntity<JobBoardPostingService.PostingResult> postToBoard(
            @PathVariable String board,
            @RequestBody JobBoardPostingService.JobPostingRequest request) {
        var result = switch (board.toLowerCase()) {
            case "linkedin" -> jobBoardPostingService.postToLinkedIn(request);
            case "indeed" -> jobBoardPostingService.postToIndeed(request);
            case "glassdoor" -> jobBoardPostingService.postToGlassdoor(request);
            default -> new JobBoardPostingService.PostingResult(board, false, null, "Unsupported board");
        };
        return ResponseEntity.ok(result);
    }
}
