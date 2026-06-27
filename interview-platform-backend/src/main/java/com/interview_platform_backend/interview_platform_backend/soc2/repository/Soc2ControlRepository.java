package com.interview_platform_backend.interview_platform_backend.soc2.repository;

import com.interview_platform_backend.interview_platform_backend.soc2.entity.Soc2Control;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface Soc2ControlRepository extends JpaRepository<Soc2Control, UUID> {

    List<Soc2Control> findByCategory(String category);

    List<Soc2Control> findByStatus(Soc2Control.ControlStatus status);

    Optional<Soc2Control> findByControlId(String controlId);

    int countByStatus(Soc2Control.ControlStatus status);
}
