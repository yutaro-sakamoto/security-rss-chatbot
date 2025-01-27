import { S3 } from "aws-sdk";
import fetch from "node-fetch";

const s3 = new S3();
const BUCKET_NAME = process.env.BUCKET_NAME!;

export const handler = async () => {
  try {
    const rssUrl = "https://www.jpcert.or.jp/rss/jpcert.rdf";
    const response = await fetch(rssUrl);
    const rssText = await response.text();
    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: `rss-${Date.now()}.txt`,
        Body: rssText,
        ContentType: "text/plain",
      })
      .promise();
    return { statusCode: 200, body: "Success" };
  } catch (_err) {
    return { statusCode: 500, body: "fail" };
  }
};
