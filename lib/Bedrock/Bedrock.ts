import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import {
  DatabaseCluster,
  DatabaseClusterEngine,
  AuroraPostgresEngineVersion,
} from "aws-cdk-lib/aws-rds";
import * as rds from "aws-cdk-lib/aws-rds";
//import { Credentials } from "aws-cdk-lib/aws-rds";
//import { bedrock, amazonaurora } from "@cdklabs/generative-ai-cdk-constructs";

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
  constructor(scope: Construct, id: string) {
    super(scope, id);
    const vpc = new ec2.Vpc(this, "VPC");
    new DatabaseCluster(this, "AuroraCluster", {
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_16_6,
      }),
      writer: rds.ClusterInstance.serverlessV2("Writer"),
      serverlessV2MinCapacity: 0,
      serverlessV2MaxCapacity: 4,
      vpc,
    });

    //const auroraVectorStore = amazonaurora.AmazonAuroraVectorStore.fromExistingAuroraVectorStore(this, "AuroraVectorStore", {

    //});
  }
}
