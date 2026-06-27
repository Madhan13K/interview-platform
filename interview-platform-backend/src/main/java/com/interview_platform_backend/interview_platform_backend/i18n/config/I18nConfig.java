package com.interview_platform_backend.interview_platform_backend.i18n.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ResourceBundleMessageSource;

import java.util.List;
import java.util.Locale;

@Configuration
public class I18nConfig {

    @Value("${app.i18n.default-locale:en}")
    private String defaultLocale;

    @Value("${app.i18n.supported-locales:en,es,fr,de,ja,zh,ar,pt,hi,ko}")
    private List<String> supportedLocales;

    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasename("messages");
        messageSource.setDefaultEncoding("UTF-8");
        messageSource.setDefaultLocale(Locale.forLanguageTag(defaultLocale));
        messageSource.setUseCodeAsDefaultMessage(true);
        return messageSource;
    }

    public Locale getDefaultLocale() {
        return Locale.forLanguageTag(defaultLocale);
    }

    public List<String> getSupportedLocales() {
        return supportedLocales;
    }
}
