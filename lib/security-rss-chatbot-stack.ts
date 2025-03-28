import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { RssCollector } from "./RSSCollector/RssCollector";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Duration } from "aws-cdk-lib";
import { BedRock } from "./Bedrock/Bedrock";
import { SlackBot } from "./SlackBot/SlackBot";

/**
 * The stack that defines the application.
 */
export class SecurityRssChatbotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "RssDataBucket", {
      lifecycleRules: [{ expiration: Duration.days(1) }],
      enforceSSL: true,
    });
    new RssCollector(this, "RssCollector", { bucket });
    new BedRock(this, "BedRock", { bucket });
    new SlackBot(this, "SlackBot");
  }
}
