package com.interview_platform_backend.interview_platform_backend.i18n.controller;

import com.interview_platform_backend.interview_platform_backend.i18n.service.I18nService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/i18n")
@RequiredArgsConstructor
public class I18nController {

    private final I18nService i18nService;

    @GetMapping("/messages")
    public ResponseEntity<Map<String, Object>> getMessages(
            @RequestParam(defaultValue = "en") String locale,
            @RequestParam(required = false) List<String> keys) {
        Locale resolvedLocale = Locale.forLanguageTag(locale);
        boolean isRtl = i18nService.isRtlLocale(resolvedLocale);

        Map<String, Object> response = Map.of(
                "locale", locale,
                "rtl", isRtl,
                "messages", keys != null
                        ? keys.stream().collect(Collectors.toMap(k -> k, k -> i18nService.getMessage(k, resolvedLocale)))
                        : Map.of()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/locales")
    public ResponseEntity<List<Map<String, Object>>> getSupportedLocales() {
        List<Map<String, Object>> locales = i18nService.getSupportedLocales().stream()
                .map(locale -> Map.<String, Object>of(
                        "code", locale.toLanguageTag(),
                        "displayName", locale.getDisplayName(locale),
                        "rtl", i18nService.isRtlLocale(locale)
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(locales);
    }

    @GetMapping("/users/{userId}/locale")
    public ResponseEntity<Map<String, Object>> getUserLocale(@PathVariable UUID userId) {
        Locale locale = i18nService.getLocaleForUser(userId);
        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "locale", locale.toLanguageTag(),
                "rtl", i18nService.isRtlLocale(locale)
        ));
    }
}
