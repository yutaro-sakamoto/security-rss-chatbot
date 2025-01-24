import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Duration } from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";

/**
 * Properties for RssCollector
 */
export interface RssCollectorProps {
  /**
   * The S3 bucket to store RSS data
   */
  readonly bucket: s3.Bucket;
}

/**
 * A stack includes the following resources
 * * Lambda function that collects RSS data
 * * S3 bucket to store RSS data
 * * EventBridge rule to trigger the Lambda function every hour
 */
export class RssCollector extends Construct {
  constructor(scope: Construct, id: string, props: RssCollectorProps) {
    super(scope, id);

    const rssCollectorFn = new NodejsFunction(this, "function", {
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: {
        BUCKET_NAME: props.bucket.bucketName,
      },
    });

    props.bucket.grantPut(rssCollectorFn);

    new events.Rule(this, "RssCollectorSchedule", {
      schedule: events.Schedule.rate(Duration.minutes(60)),
      targets: [new targets.LambdaFunction(rssCollectorFn)],
    });
  }
}
