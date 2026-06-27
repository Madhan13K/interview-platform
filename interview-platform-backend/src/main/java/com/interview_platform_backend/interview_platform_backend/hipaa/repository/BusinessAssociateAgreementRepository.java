package com.interview_platform_backend.interview_platform_backend.hipaa.repository;

import com.interview_platform_backend.interview_platform_backend.hipaa.entity.BusinessAssociateAgreement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BusinessAssociateAgreementRepository extends JpaRepository<BusinessAssociateAgreement, UUID> {

    List<BusinessAssociateAgreement> findByStatus(BusinessAssociateAgreement.BaaStatus status);

    List<BusinessAssociateAgreement> findByOrganizationId(UUID organizationId);
}
