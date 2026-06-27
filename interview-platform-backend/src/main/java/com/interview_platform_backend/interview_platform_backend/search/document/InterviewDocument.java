package com.interview_platform_backend.interview_platform_backend.search.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Document(indexName = "interviews")
@Setting(shards = 2, replicas = 1)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewDocument {

    @Id
    private String id;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String title;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String description;

    @Field(type = FieldType.Keyword)
    private String status;

    @Field(type = FieldType.Keyword)
    private String type;

    @Field(type = FieldType.Keyword)
    private String mode;

    @Field(type = FieldType.Object)
    private CandidateInfo candidate;

    @Field(type = FieldType.Object)
    private UserInfo scheduledBy;

    @Field(type = FieldType.Nested)
    private List<UserInfo> interviewers;

    @Field(type = FieldType.Date, format = DateFormat.date_hour_minute_second_millis)
    private Instant startTime;

    @Field(type = FieldType.Date, format = DateFormat.date_hour_minute_second_millis)
    private Instant endTime;

    @Field(type = FieldType.Keyword)
    private String timeZone;

    @Field(type = FieldType.Date, format = DateFormat.date_hour_minute_second_millis)
    private Instant createdAt;

    @Field(type = FieldType.Keyword)
    private String organizationId;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CandidateInfo {
        @Field(type = FieldType.Keyword)
        private String id;
        @Field(type = FieldType.Text)
        private String name;
        @Field(type = FieldType.Keyword)
        private String email;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserInfo {
        @Field(type = FieldType.Keyword)
        private String id;
        @Field(type = FieldType.Text)
        private String name;
        @Field(type = FieldType.Keyword)
        private String email;
    }
}
