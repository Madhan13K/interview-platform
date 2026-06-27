package com.interview_platform_backend.interview_platform_backend.marketplace.repository;

import com.interview_platform_backend.interview_platform_backend.marketplace.entity.MarketplacePlugin;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MarketplacePluginRepository extends JpaRepository<MarketplacePlugin, UUID> {

    Optional<MarketplacePlugin> findBySlug(String slug);

    List<MarketplacePlugin> findByCategory(MarketplacePlugin.Category category);

    List<MarketplacePlugin> findByStatus(MarketplacePlugin.Status status);

    Page<MarketplacePlugin> findByStatusAndCategory(MarketplacePlugin.Status status, MarketplacePlugin.Category category, Pageable pageable);

    Page<MarketplacePlugin> findByStatus(MarketplacePlugin.Status status, Pageable pageable);

    List<MarketplacePlugin> findByNameContainingIgnoreCase(String search);

    Page<MarketplacePlugin> findByStatusAndNameContainingIgnoreCase(MarketplacePlugin.Status status, String search, Pageable pageable);
}
