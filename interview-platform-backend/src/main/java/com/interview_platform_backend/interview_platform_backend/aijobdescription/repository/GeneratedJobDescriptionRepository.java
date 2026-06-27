package com.interview_platform_backend.interview_platform_backend.aijobdescription.repository;

import com.interview_platform_backend.interview_platform_backend.aijobdescription.entity.GeneratedJobDescription;
import com.interview_platform_backend.interview_platform_backend.aijobdescription.entity.GeneratedJobDescription.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GeneratedJobDescriptionRepository extends JpaRepository<GeneratedJobDescription, UUID> {

    List<GeneratedJobDescription> findByStatus(Status status);

    List<GeneratedJobDescription> findByJobTitleContainingIgnoreCase(String jobTitle);

    List<GeneratedJobDescription> findByDepartment(String department);
}
