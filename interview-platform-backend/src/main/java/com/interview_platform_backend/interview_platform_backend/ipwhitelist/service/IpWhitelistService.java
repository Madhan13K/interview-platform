package com.interview_platform_backend.interview_platform_backend.ipwhitelist.service;

import com.interview_platform_backend.interview_platform_backend.exception.BadRequestException;
import com.interview_platform_backend.interview_platform_backend.ipwhitelist.entity.IpWhitelistEntry;
import com.interview_platform_backend.interview_platform_backend.ipwhitelist.repository.IpWhitelistRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.InetAddress;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class IpWhitelistService {

    private static final Logger log = LoggerFactory.getLogger(IpWhitelistService.class);

    private final IpWhitelistRepository repository;

    public IpWhitelistService(IpWhitelistRepository repository) {
        this.repository = repository;
    }

    public IpWhitelistEntry addEntry(UUID organizationId, String ipAddress, String description, UUID createdBy) {
        if (repository.existsByOrganizationIdAndIpAddress(organizationId, ipAddress)) {
            throw new BadRequestException("IP address already whitelisted for this organization");
        }

        IpWhitelistEntry entry = IpWhitelistEntry.builder()
                .organizationId(organizationId)
                .ipAddress(ipAddress)
                .description(description)
                .createdBy(createdBy)
                .isActive(true)
                .build();

        entry = repository.save(entry);
        log.info("IP {} whitelisted for org {} by user {}", ipAddress, organizationId, createdBy);
        return entry;
    }

    public List<IpWhitelistEntry> getWhitelist(UUID organizationId) {
        return repository.findByOrganizationIdAndIsActiveTrue(organizationId);
    }

    public void removeEntry(UUID entryId) {
        IpWhitelistEntry entry = repository.findById(entryId)
                .orElseThrow(() -> new BadRequestException("Whitelist entry not found"));
        entry.setIsActive(false);
        repository.save(entry);
        log.info("IP {} removed from whitelist for org {}", entry.getIpAddress(), entry.getOrganizationId());
    }

    /**
     * Check if an IP address is allowed for the given organization.
     * Returns true if no whitelist is configured (open access) OR if IP matches an entry.
     */
    public boolean isIpAllowed(UUID organizationId, String clientIp) {
        List<IpWhitelistEntry> whitelist = repository.findByOrganizationIdAndIsActiveTrue(organizationId);
        
        // If no whitelist configured, allow all
        if (whitelist.isEmpty()) return true;

        for (IpWhitelistEntry entry : whitelist) {
            if (matchesIp(entry.getIpAddress(), clientIp)) {
                return true;
            }
        }
        return false;
    }

    private boolean matchesIp(String whitelistedIp, String clientIp) {
        try {
            // Handle CIDR notation (e.g., 192.168.1.0/24)
            if (whitelistedIp.contains("/")) {
                String[] parts = whitelistedIp.split("/");
                InetAddress network = InetAddress.getByName(parts[0]);
                int prefixLength = Integer.parseInt(parts[1]);
                InetAddress client = InetAddress.getByName(clientIp);

                byte[] networkBytes = network.getAddress();
                byte[] clientBytes = client.getAddress();

                if (networkBytes.length != clientBytes.length) return false;

                int fullBytes = prefixLength / 8;
                int remainingBits = prefixLength % 8;

                for (int i = 0; i < fullBytes; i++) {
                    if (networkBytes[i] != clientBytes[i]) return false;
                }

                if (remainingBits > 0) {
                    int mask = 0xFF << (8 - remainingBits);
                    return (networkBytes[fullBytes] & mask) == (clientBytes[fullBytes] & mask);
                }
                return true;
            }
            // Exact match
            return whitelistedIp.equals(clientIp);
        } catch (Exception e) {
            log.warn("Failed to match IP {} against whitelist entry {}: {}", clientIp, whitelistedIp, e.getMessage());
            return false;
        }
    }
}
