#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { SecurityRssChatbotStack } from "../lib/security-rss-chatbot-stack";
//import { AwsSolutionsChecks, NagSuppressions } from "cdk-nag";
//import { Aspects } from "aws-cdk-lib";

const app = new cdk.App();
//Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
new SecurityRssChatbotStack(app, "SecurityRssChatbotStack", {});

//NagSuppressions.addStackSuppressions(stack, [
//  {
//    id: "AwsSolutions-S1",
//    reason: "Server access logs of S3 buckets are not required",
//  },
//  { id: "AwsSolutions-IAM4", reason: "Ignore warnings of IAM policies" },
//  { id: "AwsSolutions-IAM5", reason: "Ignore warnings of IAM policies" },
//]);
