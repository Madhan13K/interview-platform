package com.interview_platform_backend.interview_platform_backend.readreplica;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
@ConditionalOnProperty(name = "app.read-replica.enabled", havingValue = "true")
public class ReadReplicaConfig {

    private static final Logger log = LoggerFactory.getLogger(ReadReplicaConfig.class);

    @Value("${spring.datasource.url}")
    private String primaryUrl;
    @Value("${spring.datasource.username}")
    private String primaryUsername;
    @Value("${spring.datasource.password}")
    private String primaryPassword;
    @Value("${spring.datasource.driver-class-name:org.postgresql.Driver}")
    private String driverClassName;

    @Value("${app.read-replica.url:${spring.datasource.url}}")
    private String replicaUrl;
    @Value("${app.read-replica.username:${spring.datasource.username}}")
    private String replicaUsername;
    @Value("${app.read-replica.password:${spring.datasource.password}}")
    private String replicaPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        log.info("Configuring read replica routing datasource");
        log.info("  Primary: {}", primaryUrl);
        log.info("  Replica: {}", replicaUrl);

        DataSource primaryDataSource = DataSourceBuilder.create()
                .url(primaryUrl)
                .username(primaryUsername)
                .password(primaryPassword)
                .driverClassName(driverClassName)
                .build();

        DataSource replicaDataSource = DataSourceBuilder.create()
                .url(replicaUrl)
                .username(replicaUsername)
                .password(replicaPassword)
                .driverClassName(driverClassName)
                .build();

        Map<Object, Object> targetDataSources = new HashMap<>();
        targetDataSources.put(DataSourceType.PRIMARY, primaryDataSource);
        targetDataSources.put(DataSourceType.REPLICA, replicaDataSource);

        ReadReplicaRoutingDataSource routingDataSource = new ReadReplicaRoutingDataSource();
        routingDataSource.setTargetDataSources(targetDataSources);
        routingDataSource.setDefaultTargetDataSource(primaryDataSource);
        routingDataSource.afterPropertiesSet();

        return routingDataSource;
    }
}
