import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
//import * as bedrock from "aws-cdk-lib/aws-bedrock";
import * as aws_iam from "aws-cdk-lib/aws-iam";
/**
 * Properties for RssCollector
 */
export interface BedRockProps {
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
export class BedRock extends Construct {
  constructor(scope: Construct, id: string, props: BedRockProps) {
    super(scope, id);
    const modelArn =
      "arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0";
    //const role =
    new aws_iam.Role(this, `KnowledgeBaseRole`, {
      roleName: `knowledgeBaseRole`,
      assumedBy: new aws_iam.ServicePrincipal("bedrock.amazonaws.com"),
      inlinePolicies: {
        inlinePolicy1: new aws_iam.PolicyDocument({
          statements: [
            new aws_iam.PolicyStatement({
              resources: [modelArn],
              actions: ["bedrock:InvokeModel"],
            }),
            new aws_iam.PolicyStatement({
              resources: [
                props.bucket.bucketArn,
                `${props.bucket.bucketArn}/*`,
              ],
              actions: ["s3:ListBucket", "s3:GetObject"],
            }),
          ],
        }),
      },
    });
    //new bedrock.CfnKnowledgeBase(this, "KnowledgeBase", {
    //    name: "KnowledgeBase",

    //    roleArn: role.roleArn,
    //    knowledgeBaseConfiguration: {
    //        type: 'VECTOR',
    //        vectorKnowledgeBaseConfiguration: {
    //            embeddingModelArn: modelArn,
    //        }
    //    },
    //});
  }
}
