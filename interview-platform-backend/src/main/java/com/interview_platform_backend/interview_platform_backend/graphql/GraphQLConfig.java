package com.interview_platform_backend.interview_platform_backend.graphql;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * GraphQL Configuration.
 * Enables GraphQL API alongside REST for complex nested queries.
 * Requires spring-boot-starter-graphql dependency.
 * 
 * Schema location: src/main/resources/graphql/schema.graphqls
 * Endpoint: /graphql
 * GraphiQL UI: /graphiql (dev only)
 */
@Configuration
@ConditionalOnProperty(name = "app.graphql.enabled", havingValue = "true", matchIfMissing = false)
public class GraphQLConfig {

    private static final Logger log = LoggerFactory.getLogger(GraphQLConfig.class);

    // GraphQL will auto-configure from schema.graphqls when
    // spring-boot-starter-graphql is on classpath.
    // DataFetchers/Resolvers are registered as @Controller with @QueryMapping/@MutationMapping
}
