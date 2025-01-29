import { Construct } from "constructs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as iam from "aws-cdk-lib/aws-iam";
/**
 * A stack includes the following resources
 * * Lambda function that collects RSS data
 * * S3 bucket to store RSS data
 * * EventBridge rule to trigger the Lambda function every hour
 */
export class SlackBot extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const topic = new sns.Topic(this, `SlackNotifyTopic`, {
      displayName: `Security Information Summary Notification`,
      topicName: `SecurityInformationSummaryNotification`,
      enforceSSL: true,
    });
    topic.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        actions: ["sns:Publish"],
        // 任意のパブリッシャーを想定
        principals: [new iam.AnyPrincipal()],
        resources: [topic.topicArn],
        conditions: {
          Bool: { "aws:SecureTransport": "false" },
        },
      }),
    );
  }
}
