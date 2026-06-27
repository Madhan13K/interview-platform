package com.interview_platform_backend.interview_platform_backend.readreplica;

import org.springframework.transaction.annotation.Transactional;
import java.lang.annotation.*;

/**
 * Marks a method/class to route queries to the read replica.
 * Equivalent to @Transactional(readOnly = true) but semantically clearer.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Transactional(readOnly = true)
@Documented
public @interface ReadOnly {
}
