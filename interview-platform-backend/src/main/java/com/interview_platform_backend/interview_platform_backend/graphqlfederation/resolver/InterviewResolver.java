package com.interview_platform_backend.interview_platform_backend.graphqlfederation.resolver;

import com.interview_platform_backend.interview_platform_backend.candidate.entity.Interview;
import com.interview_platform_backend.interview_platform_backend.candidate.repository.InterviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class InterviewResolver {
    private final InterviewRepository interviewRepository;

    public InterviewResolver(InterviewRepository interviewRepository) {
        this.interviewRepository = interviewRepository;
    }

    public List<Interview> getInterviews(int page, int size) {
        return interviewRepository.findAllWithDetails().stream()
                .skip((long) page * size).limit(size).toList();
    }

    public Optional<Interview> getInterview(UUID id) {
        return interviewRepository.findById(id);
    }
}
