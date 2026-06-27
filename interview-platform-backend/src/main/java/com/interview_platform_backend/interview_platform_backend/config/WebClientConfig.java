package com.interview_platform_backend.interview_platform_backend.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Shared WebClient configuration for non-blocking outbound HTTP calls.
 *
 * This is the first step toward reactive migration (v3.0).
 * Services should use WebClient instead of RestTemplate for:
 * - External API calls (OpenAI, Stripe, GitHub, ATS providers)
 * - Webhook delivery
 * - Background check APIs
 *
 * WebClient works fine in a WebMVC application — it provides non-blocking I/O
 * for outbound calls without requiring the entire app to be reactive.
 */
@Configuration
public class WebClientConfig {

    @Value("${app.http-client.connect-timeout:5000}")
    private int connectTimeout;

    @Value("${app.http-client.read-timeout:30000}")
    private int readTimeout;

    @Value("${app.http-client.max-memory-size:2097152}")
    private int maxMemorySize; // 2MB

    @Bean
    public WebClient.Builder webClientBuilder() {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, connectTimeout)
                .responseTimeout(Duration.ofMillis(readTimeout))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(readTimeout, TimeUnit.MILLISECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(connectTimeout, TimeUnit.MILLISECONDS)));

        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(maxMemorySize))
                .build();

        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .exchangeStrategies(strategies);
    }

    @Bean
    public WebClient webClient(WebClient.Builder builder) {
        return builder.build();
    }
}
