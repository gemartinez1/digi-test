import { gql } from '@apollo/client';

export const GET_DEVICES = gql`
  query GetDevices {
    devices {
      id
      name
      location
      type
      lastSeen
      lastTemperature
      status
    }
  }
`;

export const GET_ALERTS = gql`
  query GetAlerts {
    alerts {
      id
      deviceId
      deviceName
      type
      message
      temperature
      threshold
      timestamp
      acknowledged
    }
  }
`;

export const GET_ALERT_CONFIGS = gql`
  query GetAlertConfigs {
    alertConfigs {
      deviceId
      temperatureThreshold
      minTemperatureThreshold
      enabled
    }
  }
`;

export const ACKNOWLEDGE_ALERT = gql`
  mutation AcknowledgeAlert($id: ID!) {
    acknowledgeAlert(id: $id) {
      success
      message
    }
  }
`;

export const SET_ALERT_CONFIG = gql`
  mutation SetAlertConfig(
    $deviceId: ID!
    $temperatureThreshold: Float!
    $minTemperatureThreshold: Float
    $enabled: Boolean
  ) {
    setAlertConfig(
      deviceId: $deviceId
      temperatureThreshold: $temperatureThreshold
      minTemperatureThreshold: $minTemperatureThreshold
      enabled: $enabled
    ) {
      success
      config {
        deviceId
        temperatureThreshold
        minTemperatureThreshold
        enabled
      }
    }
  }
`;

export const POST_TELEMETRY = gql`
  mutation PostTelemetry($deviceId: ID!, $temperature: Float!, $timestamp: String) {
    postTelemetry(deviceId: $deviceId, temperature: $temperature, timestamp: $timestamp) {
      success
      alertTriggered
      alert {
        id
        deviceName
        message
      }
    }
  }
`;
