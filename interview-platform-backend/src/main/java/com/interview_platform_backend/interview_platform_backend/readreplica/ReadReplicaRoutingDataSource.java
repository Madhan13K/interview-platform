package com.interview_platform_backend.interview_platform_backend.readreplica;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;
import org.springframework.transaction.support.TransactionSynchronizationManager;

public class ReadReplicaRoutingDataSource extends AbstractRoutingDataSource {
    private static final Logger log = LoggerFactory.getLogger(ReadReplicaRoutingDataSource.class);

    @Override
    protected Object determineCurrentLookupKey() {
        boolean isReadOnly = TransactionSynchronizationManager.isCurrentTransactionReadOnly();
        DataSourceType type = isReadOnly ? DataSourceType.REPLICA : DataSourceType.PRIMARY;
        log.trace("Routing to {} datasource (readOnly={})", type, isReadOnly);
        return type;
    }
}
