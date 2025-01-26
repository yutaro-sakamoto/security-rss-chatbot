import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
//import * as bedrock from "aws-cdk-lib/aws-bedrock";
import { bedrock } from "@cdklabs/generative-ai-cdk-constructs";

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
    const kb = new bedrock.KnowledgeBase(this, "KnowledgeBase", {
      embeddingsModel: bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V1,
      instruction:
        "Use this knowledge base to answer questions about books. " +
        "It contains the full text of novels.",
    });

    new bedrock.S3DataSource(this, "DataSource", {
      bucket: props.bucket,
      knowledgeBase: kb,
      dataSourceName: "books",
      chunkingStrategy: bedrock.ChunkingStrategy.fixedSize({
        maxTokens: 500,
        overlapPercentage: 20,
      }),
    });
  }
}
