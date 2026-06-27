package com.interview_platform_backend.interview_platform_backend.dlp.repository;

import com.interview_platform_backend.interview_platform_backend.dlp.entity.DlpPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DlpPolicyRepository extends JpaRepository<DlpPolicy, UUID> {

    List<DlpPolicy> findByEnabledTrue();

    List<DlpPolicy> findByDataType(DlpPolicy.DataType dataType);

    List<DlpPolicy> findAllByOrderByMatchCountDesc();
}
