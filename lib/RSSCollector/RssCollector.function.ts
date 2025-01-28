import { S3 } from "aws-sdk";
import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";

const s3 = new S3();
const BUCKET_NAME = process.env.BUCKET_NAME!;

export const handler = async () => {
  try {
    const rssUrl = "https://www.jpcert.or.jp/rss/jpcert.rdf";
    const response = await fetch(rssUrl);
    const rssText = await response.text();

    const parser = new XMLParser();
    const rssJson = parser.parse(rssText);

    const items = rssJson["rdf:RDF"]?.item ?? [];
    const links = items.map((i: any) => i.link).filter((l: string) => l);

    for (const link of links) {
      // Determine file name
      const lastSlashIndex = link.lastIndexOf("/");
      if (lastSlashIndex === -1 || lastSlashIndex >= link.length - 1) {
        continue;
      }
      let fileName = link.substring(lastSlashIndex + 1).replace("#", "_");
      if (!fileName.endsWith(".html")) {
        fileName += ".html";
      }

      // Fetch the link
      const response = await fetch(link);
      const htmlText = await response.text();

      // Save the HTML to S3
      await s3
        .putObject({
          Bucket: BUCKET_NAME,
          Key: fileName,
          Body: htmlText,
          ContentType: "text/plain",
        })
        .promise();
    }
    return { statusCode: 200, body: "Success" };
  } catch (_err) {
    return { statusCode: 500, body: "fail" };
  }
};
