import api from "@/lib/axios";

export interface FieldDefinition {
  id: string;
  fieldName: string;
  fieldKey: string;
  fieldType: string;
  entityType: string;
  description?: string;
  isRequired: boolean;
  defaultValue?: string;
  options?: string[];
  validationRegex?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface FieldValue {
  fieldKey: string;
  fieldName: string;
  fieldType: string;
  value: unknown;
  entityId: string;
}

export const getFieldDefinitions = async (entityType: string): Promise<FieldDefinition[]> => {
  const res = await api.get("/api/v1/custom-fields/definitions", { params: { entityType } });
  return res.data;
};

export const createFieldDefinition = async (data: Partial<FieldDefinition>): Promise<FieldDefinition> => {
  const res = await api.post("/api/v1/custom-fields/definitions", data);
  return res.data;
};

export const getFieldValues = async (entityId: string, entityType: string): Promise<FieldValue[]> => {
  const res = await api.get(`/api/v1/custom-fields/values/${entityId}`, { params: { entityType } });
  return res.data;
};

export const setFieldValue = async (data: {
  fieldDefinitionId: string;
  entityId: string;
  entityType: string;
  value: unknown;
}): Promise<void> => {
  await api.post("/api/v1/custom-fields/values", data);
};
