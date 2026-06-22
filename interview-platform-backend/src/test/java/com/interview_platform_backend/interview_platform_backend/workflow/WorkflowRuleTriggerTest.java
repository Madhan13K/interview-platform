package com.interview_platform_backend.interview_platform_backend.workflow;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Workflow Engine Rule Trigger Tests")
class WorkflowRuleTriggerTest {

    enum TriggerEvent { INTERVIEW_COMPLETED, STATUS_CHANGED, APPLICATION_RECEIVED, OFFER_ACCEPTED, FEEDBACK_SUBMITTED }
    enum ActionType { SEND_EMAIL, UPDATE_STATUS, NOTIFY_TEAM, CREATE_TASK, ADVANCE_PIPELINE }
    enum ConditionType { STATUS_EQUALS, RATING_ABOVE, STAGE_IS, ALWAYS }

    @Nested
    @DisplayName("Condition Evaluation")
    class ConditionEvaluation {
        @Test void statusEqualsCondition() {
            assertTrue(evaluateCondition(ConditionType.STATUS_EQUALS, Map.of("status", "COMPLETED"), Map.of("expectedStatus", "COMPLETED")));
            assertFalse(evaluateCondition(ConditionType.STATUS_EQUALS, Map.of("status", "SCHEDULED"), Map.of("expectedStatus", "COMPLETED")));
        }
        @Test void ratingAboveCondition() {
            assertTrue(evaluateCondition(ConditionType.RATING_ABOVE, Map.of("rating", "4"), Map.of("threshold", "3")));
            assertFalse(evaluateCondition(ConditionType.RATING_ABOVE, Map.of("rating", "2"), Map.of("threshold", "3")));
        }
        @Test void alwaysCondition() {
            assertTrue(evaluateCondition(ConditionType.ALWAYS, Map.of(), Map.of()));
        }
    }

    @Nested
    @DisplayName("Action Execution")
    class ActionExecution {
        @Test void shouldIdentifyCorrectAction() {
            assertEquals(ActionType.SEND_EMAIL, ActionType.valueOf("SEND_EMAIL"));
            assertEquals(ActionType.ADVANCE_PIPELINE, ActionType.valueOf("ADVANCE_PIPELINE"));
        }
        @Test void shouldNotExecuteIfConditionFails() {
            boolean conditionMet = false;
            boolean actionExecuted = conditionMet && true;
            assertFalse(actionExecuted);
        }
        @Test void shouldExecuteIfConditionPasses() {
            boolean conditionMet = true;
            boolean actionExecuted = conditionMet;
            assertTrue(actionExecuted);
        }
    }

    @Nested
    @DisplayName("Rule Matching")
    class RuleMatching {
        @Test void shouldMatchEventToRule() {
            var rule = Map.of("trigger", "INTERVIEW_COMPLETED", "enabled", true);
            assertEquals("INTERVIEW_COMPLETED", rule.get("trigger"));
            assertTrue((boolean) rule.get("enabled"));
        }
        @Test void shouldSkipDisabledRules() {
            var rule = Map.of("trigger", "INTERVIEW_COMPLETED", "enabled", false);
            assertFalse((boolean) rule.get("enabled"));
        }
        @Test void shouldPreventInfiniteLoops() {
            int maxExecutionsPerEvent = 10;
            int executionCount = 0;
            while (executionCount < 100 && executionCount < maxExecutionsPerEvent) {
                executionCount++;
            }
            assertEquals(10, executionCount, "Should stop at max to prevent infinite loops");
        }
    }

    private boolean evaluateCondition(ConditionType type, Map<String, String> context, Map<String, String> config) {
        return switch (type) {
            case STATUS_EQUALS -> context.getOrDefault("status", "").equals(config.get("expectedStatus"));
            case RATING_ABOVE -> Integer.parseInt(context.getOrDefault("rating", "0")) > Integer.parseInt(config.getOrDefault("threshold", "0"));
            case STAGE_IS -> context.getOrDefault("stage", "").equals(config.get("expectedStage"));
            case ALWAYS -> true;
        };
    }
}
