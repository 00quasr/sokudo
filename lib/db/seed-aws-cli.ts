import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * AWS CLI challenges
 *
 * 30 challenges covering:
 * - S3 operations
 * - EC2 management
 * - Lambda functions
 * - IAM and general commands
 */
export const awsCliChallenges = [
  // === S3 ===
  {
    content: 'aws s3 ls',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List all S3 buckets',
  },
  {
    content: 'aws s3 ls s3://mybucket',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List objects in a bucket',
  },
  {
    content: 'aws s3 cp file.txt s3://mybucket/',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Upload a file to S3',
  },
  {
    content: 'aws s3 cp s3://mybucket/file.txt .',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Download a file from S3',
  },
  {
    content: 'aws s3 sync . s3://mybucket',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Sync local directory to S3',
  },
  {
    content: 'aws s3 rm s3://mybucket/file.txt',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Delete a file from S3',
  },
  {
    content: 'aws s3 mb s3://new-bucket',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Create a new S3 bucket',
  },
  {
    content: 'aws s3 rb s3://mybucket --force',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Delete a bucket and all contents',
  },
  {
    content: 'aws s3 presign s3://mybucket/file.txt',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Generate a presigned URL',
  },

  // === EC2 ===
  {
    content: 'aws ec2 describe-instances',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List all EC2 instances',
  },
  {
    content: 'aws ec2 start-instances --instance-ids i-1234567890',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Start an EC2 instance',
  },
  {
    content: 'aws ec2 stop-instances --instance-ids i-1234567890',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Stop an EC2 instance',
  },
  {
    content: 'aws ec2 describe-security-groups',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'List security groups',
  },
  {
    content: 'aws ec2 describe-vpcs',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'List VPCs',
  },
  {
    content: 'aws ec2 create-key-pair --key-name MyKeyPair',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Create a new key pair',
  },

  // === Lambda ===
  {
    content: 'aws lambda list-functions',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List Lambda functions',
  },
  {
    content: 'aws lambda invoke --function-name myFunc out.txt',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Invoke a Lambda function',
  },
  {
    content: 'aws lambda get-function --function-name myFunc',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Get function details',
  },
  {
    content: 'aws lambda update-function-code --function-name myFunc --zip-file fileb://code.zip',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Update function code',
  },

  // === IAM ===
  {
    content: 'aws iam list-users',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List IAM users',
  },
  {
    content: 'aws iam list-roles',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List IAM roles',
  },
  {
    content: 'aws iam get-user',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Get current user info',
  },
  {
    content: 'aws sts get-caller-identity',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Get current identity',
  },

  // === General ===
  {
    content: 'aws configure',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Configure AWS credentials',
  },
  {
    content: 'aws configure list',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List current configuration',
  },
  {
    content: 'aws --region us-west-2 ec2 describe-instances',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Run command in specific region',
  },
  {
    content: 'aws --profile production s3 ls',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Use a named profile',
  },
  {
    content: 'aws cloudwatch get-metric-statistics --namespace AWS/EC2 --metric-name CPUUtilization',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Get CloudWatch metrics',
  },
  {
    content: 'aws logs tail /aws/lambda/myFunc --follow',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Tail CloudWatch logs',
  },
];

export async function seedAwsCliChallenges() {
  console.log('Seeding AWS CLI challenges...');

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'aws-cli'))
    .limit(1);

  if (!category) {
    console.error('Error: AWS CLI category not found. Run db:seed first.');
    process.exit(1);
  }

  const challengeData = awsCliChallenges.map((challenge) => ({
    ...challenge,
    categoryId: category.id,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${awsCliChallenges.length} AWS CLI challenges.`);
}

if (require.main === module) {
  seedAwsCliChallenges()
    .catch((error) => {
      console.error('Seed AWS CLI failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed AWS CLI finished. Exiting...');
      process.exit(0);
    });
}
