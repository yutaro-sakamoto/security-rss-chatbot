import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import {
  DatabaseCluster,
  DatabaseClusterEngine,
  AuroraPostgresEngineVersion,
} from "aws-cdk-lib/aws-rds";
import * as rds from "aws-cdk-lib/aws-rds";
import { aws_bedrock as bedrock } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
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
  constructor(scope: Construct, id: string, props: BedRockProps) {
    super(scope, id);

    const databaseName = "mydb";

    const vpc = new ec2.Vpc(this, "VPC", {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "isolated",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    vpc.addInterfaceEndpoint("RDSDataEndpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.RDS_DATA,
    });

    const auroraSecurityGroup = new ec2.SecurityGroup(
      this,
      "AuroraSecurityGroup",
      {
        vpc,
        allowAllOutbound: true,
        description: "Security group for Aurora cluster",
      },
    );

    // Bedrockからのアクセスを許可するインバウンドルール
    auroraSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      "Allow VPC endpoint access to Aurora PostgreSQL",
    );

    const auroraCluster = new DatabaseCluster(this, "AuroraCluster", {
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_16_6,
      }),
      writer: rds.ClusterInstance.serverlessV2("Writer"),
      serverlessV2MinCapacity: 0,
      serverlessV2MaxCapacity: 4,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      enableDataApi: true,
      iamAuthentication: true,
      securityGroups: [auroraSecurityGroup],
      defaultDatabaseName: databaseName,
    });

    // 1. Bedrock Knowledge Base用のIAMロールを作成
    const bedrockKbRole = new iam.Role(this, "BedrockKbIamRole", {
      // Bedrockがロールを引き受けるためのServicePrincipal
      assumedBy: new iam.ServicePrincipal("bedrock.amazonaws.com"),
    });

    // 2. S3フルアクセスのポリシーをinlineで付与
    bedrockKbRole.attachInlinePolicy(
      new iam.Policy(this, "S3FullAccessPolicy", {
        statements: [
          new iam.PolicyStatement({
            actions: ["s3:*"],
            resources: ["*"],
          }),
        ],
      }),
    );

    // 3. Auroraフルアクセスのポリシーをinlineで付与
    bedrockKbRole.attachInlinePolicy(
      new iam.Policy(this, "AuroraFullAccessPolicy", {
        statements: [
          new iam.PolicyStatement({
            actions: ["rds:*", "rds-data:*", "rds-db:connect"],
            resources: ["*"],
          }),
        ],
      }),
    );

    bedrockKbRole.attachInlinePolicy(
      new iam.Policy(this, "SecretsManagerPolicy", {
        statements: [
          new iam.PolicyStatement({
            actions: [
              "secretsmanager:GetSecretValue",
              "secretsmanager:DescribeSecret",
            ],
            resources: [auroraCluster.secret!.secretArn],
          }),
        ],
      }),
    );

    const knowledgeBase = new bedrock.CfnKnowledgeBase(this, "KnowledgeBase", {
      name: "MyKnowledgeBase",
      description: "This is my knowledge base",
      roleArn: bedrockKbRole.roleArn,
      knowledgeBaseConfiguration: {
        type: "VECTOR",
        vectorKnowledgeBaseConfiguration: {
          embeddingModelArn:
            "arn:aws:bedrock:ap-northeast-1::foundation-model/amazon.titan-embed-text-v2:0",
        },
      },
      storageConfiguration: {
        type: "RDS",
        rdsConfiguration: {
          resourceArn: auroraCluster.clusterArn,
          credentialsSecretArn: auroraCluster.secret!.secretArn,
          databaseName: databaseName,
          tableName: "mytable",
          fieldMapping: {
            vectorField: "embedding",
            textField: "chunks",
            metadataField: "metadata",
            primaryKeyField: "id",
          },
        },
      },
    });

    knowledgeBase.node.addDependency(auroraCluster);

    new bedrock.CfnDataSource(this, "DataSource", {
      knowledgeBaseId: knowledgeBase.ref,
      name: "MyDataSource",
      dataSourceConfiguration: {
        type: "S3",
        s3Configuration: {
          bucketArn: props.bucket.bucketArn,
        },
      },
    });
  }
}
