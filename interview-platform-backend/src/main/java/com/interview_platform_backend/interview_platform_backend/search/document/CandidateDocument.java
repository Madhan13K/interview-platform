package com.interview_platform_backend.interview_platform_backend.search.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.*;

import java.time.Instant;
import java.util.List;

@Document(indexName = "candidates")
@Setting(shards = 2, replicas = 1)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateDocument {

    @Id
    private String id;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String firstName;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String lastName;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String fullName;

    @Field(type = FieldType.Keyword)
    private String email;

    @Field(type = FieldType.Keyword)
    private String status;

    @Field(type = FieldType.Keyword)
    private List<String> skills;

    @Field(type = FieldType.Text)
    private String company;

    @Field(type = FieldType.Text)
    private String bio;

    @Field(type = FieldType.Integer)
    private Integer totalInterviews;

    @Field(type = FieldType.Keyword)
    private String pipelineStage;

    @Field(type = FieldType.Date, format = DateFormat.date_hour_minute_second_millis)
    private Instant createdAt;

    @Field(type = FieldType.Date, format = DateFormat.date_hour_minute_second_millis)
    private Instant lastInterviewAt;

    @Field(type = FieldType.Keyword)
    private String organizationId;
}
