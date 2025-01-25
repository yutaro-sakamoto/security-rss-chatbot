import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
//import * as bedrock from "aws-cdk-lib/aws-bedrock";
import * as aws_iam from "aws-cdk-lib/aws-iam";
import * as opensearchserverless from "aws-cdk-lib/aws-opensearchserverless";

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

    const aossFullAccessRole = new aws_iam.Role(this, `aossFullAccessPolicy`, {
      roleName: `aossFullAccessRole`,
      assumedBy: new aws_iam.ServicePrincipal("bedrock.amazonaws.com"),
      inlinePolicies: {
        inlinePolicy1: new aws_iam.PolicyDocument({
          statements: [
            new aws_iam.PolicyStatement({
              resources: ["*"],
              actions: ["aoss:*"],
            }),
          ],
        }),
      },
    });

    // Create a collection for searching
    const collection = new opensearchserverless.CfnCollection(
      this,
      "Collection",
      {
        name: "knowledge-base",
        type: "VECTORSEARCH",
        standbyReplicas: "DISABLED",
      },
    );

    // Encryption security config for collection
    const collectionSecurityPolicy = new opensearchserverless.CfnSecurityPolicy(
      this,
      "AOSSEncryptionPolicy",
      {
        name: "knowledge-base-encryption-policy",
        type: "encryption",
        policy: JSON.stringify({
          Rules: [
            {
              ResourceType: "collection",
              Resource: [`collection/${collection.name}`],
            },
          ],
          AWSOwnedKey: true,
        }),
      },
    );

    collection.addDependency(collectionSecurityPolicy);

    // Network security config for collection
    new opensearchserverless.CfnSecurityPolicy(this, "AOSSNetworkPolicy", {
      name: "knowledge-base-network-policy",
      type: "network",
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: "collection",
              Resource: [`collection/${collection.name}`],
            },
            {
              ResourceType: "dashboard",
              Resource: [`collection/${collection.name}`],
            },
          ],
          AllowFromPublic: false,
          SourceServices: ["bedrock.amazonaws.com"],
        },
      ]),
    });

    // Network security config for collection
    new opensearchserverless.CfnAccessPolicy(this, "AOSSAccessPolicy", {
      name: "knowledge-base-access-policy",
      type: "data",
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: "collection",
              Resource: [`collection/${collection.name}`],
              Permission: ["aoss:*"],
            },
            {
              ResourceType: "index",
              Resource: [`index/${collection.name}/*`],
              Permission: ["aoss:*"],
            },
          ],
          Principal: [aossFullAccessRole.roleArn],
        },
      ]),
    });

    //// Resource policy granting access
    //new opensearchserverless.CfnAccessPolicy(this, "CollectionPolicy", {
    //  name: "my-opensearch-policy",
    //  type: "data",
    //  policy: JSON.stringify({
    //    Version: "2012-10-17",
    //    Statement: [
    //      {
    //        Effect: "Allow",
    //        Principal: { AWS: "*" }, // Adjust to your needs
    //        Action: ["os:ESHttp*"],
    //        Resource: `arn:aws:opensearchserverless:${this.region}:${this.account}:collection/${collection.name}/*`
    //      }
    //    ]
    //  })
    //});

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
