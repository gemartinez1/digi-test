import { GraphQLError } from 'graphql';
import { db } from '../services/database';
import { processTelemetry } from '../services/alertProcessor';

export const resolvers = {
  Query: {
    devices: () => db.getDevices(),

    device: (_: unknown, { id }: { id: string }) => {
      const device = db.getDevice(id);
      if (!device) {
        throw new GraphQLError(`Device '${id}' not found`, {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      return device;
    },

    alerts: (_: unknown, { includeAll }: { includeAll?: boolean }) =>
      db.getAlerts(includeAll ?? false),

    alertConfig: (_: unknown, { deviceId }: { deviceId: string }) => {
      const config = db.getAlertConfig(deviceId);
      if (!config) {
        throw new GraphQLError(`No config found for device '${deviceId}'`, {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      return config;
    },

    alertConfigs: () => db.getAllAlertConfigs(),

    telemetryLog: () => db.getTelemetryLog(),
  },

  Mutation: {
    postTelemetry: (
      _: unknown,
      args: { deviceId: string; temperature: number; timestamp?: string; humidity?: number }
    ) => {
      if (!args.deviceId) {
        throw new GraphQLError('deviceId is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (typeof args.temperature !== 'number') {
        throw new GraphQLError('temperature must be a number', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      const timestamp = args.timestamp ?? new Date().toISOString();
      if (isNaN(Date.parse(timestamp))) {
        throw new GraphQLError('timestamp must be a valid ISO date string', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      const payload = {
        deviceId: args.deviceId,
        temperature: args.temperature,
        humidity: args.humidity,
        timestamp,
      };
      const alert = processTelemetry(payload);
      return {
        success: true,
        received: payload,
        alertTriggered: alert !== null,
        alert: alert ?? null,
      };
    },

    acknowledgeAlert: (_: unknown, { id }: { id: string }) => {
      const success = db.acknowledgeAlert(id);
      if (!success) {
        throw new GraphQLError(`Alert '${id}' not found`, {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      return { success: true, message: 'Alert acknowledged' };
    },

    setAlertConfig: (
      _: unknown,
      args: {
        deviceId: string;
        temperatureThreshold: number;
        minTemperatureThreshold?: number;
        enabled?: boolean;
      }
    ) => {
      if (!args.deviceId) {
        throw new GraphQLError('deviceId is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (typeof args.temperatureThreshold !== 'number') {
        throw new GraphQLError('temperatureThreshold must be a number', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      const config = {
        deviceId: args.deviceId,
        temperatureThreshold: args.temperatureThreshold,
        minTemperatureThreshold: args.minTemperatureThreshold,
        enabled: args.enabled ?? true,
      };
      db.setAlertConfig(config);
      return { success: true, config };
    },
  },
};
