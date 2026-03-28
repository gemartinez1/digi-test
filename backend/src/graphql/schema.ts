export const typeDefs = `#graphql
  type Device {
    id: ID!
    name: String!
    location: String!
    type: String!
    lastSeen: String!
    lastTemperature: Float
    status: String!
  }

  type Alert {
    id: ID!
    deviceId: ID!
    deviceName: String!
    type: String!
    message: String!
    temperature: Float!
    threshold: Float!
    timestamp: String!
    acknowledged: Boolean!
  }

  type AlertConfig {
    deviceId: ID!
    temperatureThreshold: Float!
    minTemperatureThreshold: Float
    enabled: Boolean!
  }

  type TelemetryPayload {
    deviceId: ID!
    temperature: Float!
    humidity: Float
    timestamp: String!
  }

  type TelemetryResult {
    success: Boolean!
    received: TelemetryPayload!
    alertTriggered: Boolean!
    alert: Alert
  }

  type AlertConfigResult {
    success: Boolean!
    config: AlertConfig!
  }

  type AcknowledgeResult {
    success: Boolean!
    message: String!
  }

  type Query {
    devices: [Device!]!
    device(id: ID!): Device
    alerts(includeAll: Boolean): [Alert!]!
    alertConfig(deviceId: ID!): AlertConfig
    alertConfigs: [AlertConfig!]!
    telemetryLog: [TelemetryPayload!]!
  }

  type Mutation {
    postTelemetry(
      deviceId: ID!
      temperature: Float!
      timestamp: String
      humidity: Float
    ): TelemetryResult!
    acknowledgeAlert(id: ID!): AcknowledgeResult!
    setAlertConfig(
      deviceId: ID!
      temperatureThreshold: Float!
      minTemperatureThreshold: Float
      enabled: Boolean
    ): AlertConfigResult!
  }
`;
