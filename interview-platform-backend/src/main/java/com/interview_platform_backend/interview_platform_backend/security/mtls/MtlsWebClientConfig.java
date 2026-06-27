package com.interview_platform_backend.interview_platform_backend.security.mtls;

import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.TrustManagerFactory;
import java.io.InputStream;
import java.security.KeyStore;

/**
 * Configuration for outbound HTTP calls using mTLS.
 *
 * <p>Provides a dedicated {@link WebClient} bean that presents a client certificate
 * when connecting to downstream services that require mTLS authentication.
 *
 * <p>Use this WebClient (qualified as "mtlsWebClient") when calling services that
 * require mutual TLS authentication, such as:
 * <ul>
 *   <li>Internal microservices in a zero-trust mesh</li>
 *   <li>Partner APIs requiring certificate-based authentication</li>
 *   <li>Payment gateways with mTLS requirements</li>
 *   <li>Cloud provider APIs (some AWS/GCP services)</li>
 * </ul>
 *
 * <h3>Usage:</h3>
 * <pre>
 * {@code
 * @Autowired
 * @Qualifier("mtlsWebClient")
 * private WebClient mtlsWebClient;
 *
 * public Mono<String> callSecureService() {
 *     return mtlsWebClient.get()
 *         .uri("https://partner-service.example.com/api/data")
 *         .retrieve()
 *         .bodyToMono(String.class);
 * }
 * }
 * </pre>
 */
@Configuration
@ConditionalOnProperty(name = "app.mtls.enabled", havingValue = "true")
public class MtlsWebClientConfig {

    private static final Logger log = LoggerFactory.getLogger(MtlsWebClientConfig.class);

    @Value("${app.mtls.client.key-store:classpath:certs/client-keystore.p12}")
    private Resource clientKeyStore;

    @Value("${app.mtls.client.key-store-password:changeit}")
    private String clientKeyStorePassword;

    @Value("${app.mtls.client.trust-store:classpath:certs/server-truststore.p12}")
    private Resource clientTrustStore;

    @Value("${app.mtls.client.trust-store-password:changeit}")
    private String clientTrustStorePassword;

    /**
     * Creates a WebClient configured with mTLS client certificate for outbound calls.
     *
     * <p>This WebClient will present the configured client certificate during TLS handshake
     * with downstream services, enabling mutual authentication.
     */
    @Bean(name = "mtlsWebClient")
    public WebClient mtlsWebClient() throws Exception {
        SslContext sslContext = buildMtlsSslContext();

        HttpClient httpClient = HttpClient.create()
                .secure(spec -> spec.sslContext(sslContext));

        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }

    /**
     * Builds a Netty SslContext configured with both client identity (keystore)
     * and server trust (truststore) for mutual TLS.
     */
    private SslContext buildMtlsSslContext() throws Exception {
        // Load client keystore (contains our client certificate + private key)
        KeyManagerFactory keyManagerFactory = KeyManagerFactory.getInstance(
                KeyManagerFactory.getDefaultAlgorithm());
        KeyStore keyStore = KeyStore.getInstance("PKCS12");

        try (InputStream keyStoreStream = clientKeyStore.getInputStream()) {
            keyStore.load(keyStoreStream, clientKeyStorePassword.toCharArray());
        }
        keyManagerFactory.init(keyStore, clientKeyStorePassword.toCharArray());

        // Load truststore (contains CA certificates we trust for server verification)
        TrustManagerFactory trustManagerFactory = TrustManagerFactory.getInstance(
                TrustManagerFactory.getDefaultAlgorithm());
        KeyStore trustStore = KeyStore.getInstance("PKCS12");

        try (InputStream trustStoreStream = clientTrustStore.getInputStream()) {
            trustStore.load(trustStoreStream, clientTrustStorePassword.toCharArray());
        }
        trustManagerFactory.init(trustStore);

        log.info("mTLS WebClient configured with client certificate from keystore and truststore");

        return SslContextBuilder.forClient()
                .keyManager(keyManagerFactory)
                .trustManager(trustManagerFactory)
                .protocols("TLSv1.2", "TLSv1.3")
                .build();
    }
}
