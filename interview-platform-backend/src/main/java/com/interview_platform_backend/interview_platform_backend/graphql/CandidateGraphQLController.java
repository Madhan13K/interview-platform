package com.interview_platform_backend.interview_platform_backend.graphql;

import com.interview_platform_backend.interview_platform_backend.candidate.entity.Interview;
import com.interview_platform_backend.interview_platform_backend.candidate.repository.InterviewRepository;
import com.interview_platform_backend.interview_platform_backend.user.entity.User;
import com.interview_platform_backend.interview_platform_backend.user.repository.UserRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.UUID;

/**
 * GraphQL Controller for Candidate-related queries.
 * Enables complex nested data fetching in a single request:
 * - Candidate with all interviews
 * - Interview with feedback + scorecards
 * - Nested pipeline stage history
 */
@Controller
@ConditionalOnProperty(name = "app.graphql.enabled", havingValue = "true", matchIfMissing = false)
public class CandidateGraphQLController {

    private final UserRepository userRepository;
    private final InterviewRepository interviewRepository;

    public CandidateGraphQLController(UserRepository userRepository, InterviewRepository interviewRepository) {
        this.userRepository = userRepository;
        this.interviewRepository = interviewRepository;
    }

    @QueryMapping
    public User candidate(@Argument String id) {
        return userRepository.findById(UUID.fromString(id)).orElse(null);
    }

    @QueryMapping
    public List<User> candidates(@Argument int page, @Argument int size) {
        return userRepository.findAll(org.springframework.data.domain.PageRequest.of(page, size)).getContent();
    }

    @QueryMapping
    public Interview interview(@Argument String id) {
        return interviewRepository.findById(UUID.fromString(id)).orElse(null);
    }

    @QueryMapping
    public List<Interview> interviews(@Argument int page, @Argument int size) {
        return interviewRepository.findAll(org.springframework.data.domain.PageRequest.of(page, size)).getContent();
    }

    @SchemaMapping(typeName = "Candidate", field = "interviews")
    public List<Interview> candidateInterviews(User user) {
        return interviewRepository.findByCandidateId(user.getId());
    }
}
