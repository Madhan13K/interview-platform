package com.interview_platform_backend.interview_platform_backend.competitiveintel.repository;

import com.interview_platform_backend.interview_platform_backend.competitiveintel.entity.CompetitorData;
import com.interview_platform_backend.interview_platform_backend.competitiveintel.entity.CompetitorData.DataType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CompetitorDataRepository extends JpaRepository<CompetitorData, UUID> {

    List<CompetitorData> findByCompetitorName(String competitorName);

    List<CompetitorData> findByCompetitorNameAndDataType(String competitorName, DataType dataType);

    List<CompetitorData> findByDataTypeAndRole(DataType dataType, String role);

    List<CompetitorData> findByDataTypeAndRoleAndLocation(DataType dataType, String role, String location);

    List<CompetitorData> findByCompetitorNameOrderByCollectedAtDesc(String competitorName);
}
