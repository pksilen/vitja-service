import { Meter } from '@opentelemetry/metrics';
import { BoundCounter, Counter, ValueRecorder } from '@opentelemetry/api';
import defaultPrometheusMeter from './defaultPrometheusMeter';

class DefaultServiceMetrics {
  // noinspection MagicNumberJS
  private readonly processingTimeInSecsBuckets = [
    0.001,
    0.005,
    0.01,
    0.05,
    0.1,
    0.2,
    0.3,
    0.4,
    0.5,
    1,
    2,
    5,
    10,
    30,
    60,
    120,
    300,
    1800,
    Number.POSITIVE_INFINITY
  ];

  private readonly defaultLabels = { pid: process.pid.toString() };
  private readonly allServiceFunctionCallCounter: BoundCounter;
  private readonly serviceFunctionCallCounter: Counter;
  private readonly authorizationFailureCounter: BoundCounter;
  private readonly http5xxErrorCounter: BoundCounter;
  private readonly dbOperationErrorCounter: Counter;
  private readonly dbFailureDurationInSecsRecorder: ValueRecorder;
  private readonly serviceFunctionProcessingTimeCounter: Counter;
  private readonly dbOperationProcessingTimeCounter: Counter;
  private readonly kafkaConsumerErrorCounter: BoundCounter;
  private readonly kafkaConsumerRequestTimeoutCounter: BoundCounter;
  private readonly kafkaConsumerOffsetLagRecorder: ValueRecorder;
  private readonly syncRemoteServiceCallCounter: Counter;

  constructor(private readonly meter: Meter) {
    this.allServiceFunctionCallCounter = meter
      .createCounter('all_service_function_calls', {
        description: 'Number of all service function calls'
      })
      .bind(this.defaultLabels);

    this.serviceFunctionCallCounter = meter.createCounter('service_function_calls', {
      description: 'Number of service function calls'
    });

    this.authorizationFailureCounter = meter
      .createCounter('authorization_failures', {
        description: 'Number of HTTP requests where authorization failed'
      })
      .bind(this.defaultLabels);

    this.http5xxErrorCounter = meter
      .createCounter('http_5xx_errors', {
        description: 'Number of HTTP 5xx errors'
      })
      .bind(this.defaultLabels);

    this.dbOperationErrorCounter = meter.createCounter('db_operation_errors', {
      description: 'Number of database operation errors'
    });

    this.dbFailureDurationInSecsRecorder = meter.createValueRecorder('db_failure_duration_in_secs', {
      description: 'Database failure duration in seconds'
    });

    this.serviceFunctionProcessingTimeCounter = meter.createCounter('service_function_processing_time', {
      description:
        'Count of service function calls where service function processing time is in processing time bucket'
    });

    this.dbOperationProcessingTimeCounter = meter.createCounter('db_operation_processing_time', {
      description:
        'Count of database operations where database operation processing time is in processing time bucket'
    });

    this.kafkaConsumerErrorCounter = meter
      .createCounter('kafka_consumer_errors', {
        description: 'Number of Kafka consumer errors'
      })
      .bind(this.defaultLabels);

    this.kafkaConsumerRequestTimeoutCounter = meter
      .createCounter('kafka_consumer_request_timeouts', {
        description: 'Number of Kafka consumer request timeouts'
      })
      .bind(this.defaultLabels);

    this.kafkaConsumerOffsetLagRecorder = meter.createValueRecorder('kafka_consumer_offset_lag', {
      description: 'Kafka consumer offset lag'
    });

    this.syncRemoteServiceCallCounter = meter.createCounter('sync_remote_service_calls', {
      description: 'Number of synchronous (HTTP) remote service calls'
    });
  }

  incrementServiceFunctionCallsByOne(serviceFunction: string) {
    this.allServiceFunctionCallCounter.add(1);
    this.serviceFunctionCallCounter.bind({ ...this.defaultLabels, serviceFunction }).add(1);
  }

  incrementAuthorizationFailuresByOne() {
    this.authorizationFailureCounter.add(1);
  }

  incrementHttp5xxErrorsByOne() {
    this.http5xxErrorCounter.add(1);
  }

  incrementDbOperationErrorsByOne(dbManagerType: string, dbHost: string) {
    this.dbOperationErrorCounter.bind({ ...this.defaultLabels, dbManagerType, dbHost }).add(1);
  }

  recordDbFailureDurationInSecs(dbManagerType: string, dbHost: string, failureDurationInSecs: number) {
    this.dbFailureDurationInSecsRecorder
      .bind({ ...this.defaultLabels, dbManagerType, dbHost })
      .record(failureDurationInSecs);
  }

  incrementServiceFunctionProcessingTimeInSecsBucketCounterByOne(
    serviceFunction: string,
    processingTimeInSecs: number
  ) {
    const foundProcessingTimeInSecsBucket = this.processingTimeInSecsBuckets.find(
      (processingTimeInSecsBucket) => processingTimeInSecs <= processingTimeInSecsBucket
    );

    this.serviceFunctionProcessingTimeCounter
      .bind({
        ...this.defaultLabels,
        serviceFunction,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        processingTimeInSecsBucket: foundProcessingTimeInSecsBucket!.toString()
      })
      .add(1);
  }

  incrementDbOperationProcessingTimeInSecsBucketCounterByOne(
    dbManagerType: string,
    dbHost: string,
    processingTimeInSecs: number
  ) {
    const foundProcessingTimeInSecsBucket = this.processingTimeInSecsBuckets.find(
      (processingTimeInSecsBucket) => processingTimeInSecs <= processingTimeInSecsBucket
    );

    this.dbOperationProcessingTimeCounter
      .bind({
        ...this.defaultLabels,
        dbManagerType,
        dbHost,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        processingTimeInSecsBucket: foundProcessingTimeInSecsBucket!.toString()
      })
      .add(1);
  }

  incrementKafkaConsumerErrorsByOne() {
    this.kafkaConsumerErrorCounter.add(1);
  }

  incrementKafkaConsumerRequestTimeoutsByOne() {
    this.kafkaConsumerRequestTimeoutCounter.add(1);
  }

  recordKafkaConsumerOffsetLag(partition: any, offsetLag: number) {
    this.kafkaConsumerOffsetLagRecorder.bind({ ...this.defaultLabels, partition }).record(offsetLag);
  }

  incrementSyncRemoteServiceCallCountByOne(remoteServiceUrl: string) {
    this.syncRemoteServiceCallCounter.bind({ ...this.defaultLabels, remoteServiceUrl }).add(1);
  }
}

export default new DefaultServiceMetrics(defaultPrometheusMeter);
