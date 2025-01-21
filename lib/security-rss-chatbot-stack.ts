import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { RssCollector } from "./RSSCollector/RssCollector";

/**
 * The stack that defines the application.
 */
export class SecurityRssChatbotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    new RssCollector(this, "RssCollector");
  }
}
