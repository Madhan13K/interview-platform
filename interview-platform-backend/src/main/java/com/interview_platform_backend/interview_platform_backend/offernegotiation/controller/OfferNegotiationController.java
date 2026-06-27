package com.interview_platform_backend.interview_platform_backend.offernegotiation.controller;

import com.interview_platform_backend.interview_platform_backend.offernegotiation.entity.OfferNegotiation;
import com.interview_platform_backend.interview_platform_backend.offernegotiation.service.OfferNegotiationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/offer-negotiations")
@RequiredArgsConstructor
public class OfferNegotiationController {

    private final OfferNegotiationService offerNegotiationService;

    @PostMapping
    public ResponseEntity<OfferNegotiation> startNegotiation(@RequestBody OfferNegotiation negotiation) {
        return ResponseEntity.ok(offerNegotiationService.startNegotiation(negotiation));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OfferNegotiation> getById(@PathVariable UUID id) {
        OfferNegotiation negotiation = offerNegotiationService.getById(id);
        if (negotiation == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(negotiation);
    }

    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<List<OfferNegotiation>> listByCandidate(@PathVariable UUID candidateId) {
        return ResponseEntity.ok(offerNegotiationService.listByCandidate(candidateId));
    }

    @PutMapping("/{id}/counter-offer")
    public ResponseEntity<OfferNegotiation> submitCounterOffer(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(offerNegotiationService.submitCounterOffer(id, body.get("counterOffer")));
    }

    @PostMapping("/{id}/ai-suggestion")
    public ResponseEntity<OfferNegotiation> getAISuggestion(@PathVariable UUID id) {
        return ResponseEntity.ok(offerNegotiationService.getAISuggestion(id));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<OfferNegotiation> resolveNegotiation(@PathVariable UUID id, @RequestParam OfferNegotiation.Status status) {
        return ResponseEntity.ok(offerNegotiationService.resolveNegotiation(id, status));
    }
}
