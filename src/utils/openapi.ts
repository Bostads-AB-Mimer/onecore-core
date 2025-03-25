import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

// Registry to store all registered schemas
export const schemaRegistry: Record<string, any> = {}

/**
 * Registers a Zod schema as an OpenAPI component
 * @param name The name to register the schema under
 * @param schema The Zod schema to register
 * @param description Optional description for the schema
 * @returns The name of the registered schema (for reference)
 */
export function registerSchema<T extends z.ZodType>(
  name: string,
  schema: T,
  description?: string
): string {
  const jsonSchema = zodToJsonSchema(schema, {
    $refStrategy: 'none',
    target: 'openApi3',
  })

  // Extract the schema object from the result
  let schemaObject = jsonSchema

  // Remove any unnecessary wrapper objects
  if ('properties' in schemaObject || 'type' in schemaObject) {
    // This is already a valid schema object
  } else if (jsonSchema.definitions && jsonSchema.definitions[name]) {
    schemaObject = jsonSchema.definitions[name]
  }

  // Add description if provided
  if (description && typeof schemaObject === 'object') {
    ;(schemaObject as any).description = description
  }

  // Process property descriptions if they exist
  if (typeof schemaObject === 'object' && 'properties' in schemaObject) {
    const properties = (schemaObject as any).properties
    if (properties && typeof properties === 'object') {
      Object.entries(properties).forEach(
        ([propName, propSchema]: [string, any]) => {
          // If the property has a description from Zod's describe(), preserve it
          if (propSchema.description) {
            // Description is already set from Zod's describe()
          } else if (description) {
            // Use a generic property description based on the schema description
            propSchema.description = `${propName} of the ${description}`
          }
        }
      )
    }
  }

  // Store in registry
  schemaRegistry[name] = schemaObject

  return name
}

/**
 * Gets all registered schemas as OpenAPI components
 */
export function getRegisteredSchemas() {
  const schemas: Record<string, any> = {}

  for (const [name, schema] of Object.entries(schemaRegistry)) {
    schemas[name] = schema
  }

  // Debug log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Registered schemas:', Object.keys(schemas))
  }

  return schemas
}

/**
 * Debug utility to print schema details
 * @param name Optional schema name to print, or all schemas if not provided
 */
export function debugSchema(name?: string) {
  if (name && schemaRegistry[name]) {
    console.log(
      `Schema ${name}:`,
      JSON.stringify(schemaRegistry[name], null, 2)
    )
  } else if (!name) {
    console.log('All schemas:', JSON.stringify(schemaRegistry, null, 2))
  } else {
    console.log(
      `Schema ${name} not found. Available schemas:`,
      Object.keys(schemaRegistry)
    )
  }
}

/**
 * Helper to create a Zod schema with descriptions for OpenAPI
 * @param schema The base Zod schema
 * @param descriptions Object mapping property names to descriptions
 * @returns The schema with descriptions added
 */
export function describeSchema<T extends z.ZodObject<any>>(
  schema: T,
  descriptions: Record<string, string>
): T {
  // Create a new schema with the same shape
  const newSchema = z.object({}) as any

  // Get the shape of the original schema
  const shape = schema.shape

  // Add each property with description if available
  Object.entries(shape).forEach(([key, value]: [string, any]) => {
    if (descriptions[key]) {
      newSchema[key] = value.describe(descriptions[key])
    } else {
      newSchema[key] = value
    }
  })

  return newSchema as T
}
