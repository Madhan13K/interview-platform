package com.interview_platform_backend.interview_platform_backend.i18n.service;

import com.interview_platform_backend.interview_platform_backend.i18n.config.I18nConfig;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class I18nService {

    private static final Logger log = LoggerFactory.getLogger(I18nService.class);
    private static final Set<String> RTL_LANGUAGES = Set.of("ar", "he", "fa", "ur");

    private final MessageSource messageSource;
    private final I18nConfig i18nConfig;

    public String getMessage(String key, Locale locale) {
        String message = messageSource.getMessage(key, null, key, locale);
        log.debug("Resolved message key [{}] for locale [{}]: {}", key, locale, message);
        return message;
    }

    public List<Locale> getSupportedLocales() {
        return i18nConfig.getSupportedLocales().stream()
                .map(Locale::forLanguageTag)
                .collect(Collectors.toList());
    }

    public Locale getLocaleForUser(UUID userId) {
        // Default implementation returns the default locale.
        // In production, this would query user preferences from the database.
        log.debug("Getting locale for user [{}], returning default", userId);
        return i18nConfig.getDefaultLocale();
    }

    public boolean isRtlLocale(Locale locale) {
        return RTL_LANGUAGES.contains(locale.getLanguage());
    }
}
