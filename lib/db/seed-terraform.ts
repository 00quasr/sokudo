import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Terraform CLI challenges
 *
 * 25 challenges covering:
 * - Init, plan, apply
 * - State management
 * - Workspaces and modules
 */
export const terraformChallenges = [
  // === Core Workflow ===
  {
    content: 'terraform init',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Initialize Terraform working directory',
  },
  {
    content: 'terraform plan',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Preview infrastructure changes',
  },
  {
    content: 'terraform apply',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Apply infrastructure changes',
  },
  {
    content: 'terraform destroy',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Destroy all managed infrastructure',
  },
  {
    content: 'terraform apply -auto-approve',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Apply without confirmation prompt',
  },
  {
    content: 'terraform plan -out=tfplan',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Save plan to a file',
  },
  {
    content: 'terraform apply tfplan',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Apply a saved plan',
  },

  // === Validation and Format ===
  {
    content: 'terraform validate',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Validate configuration files',
  },
  {
    content: 'terraform fmt',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Format configuration files',
  },
  {
    content: 'terraform fmt -check',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Check if files are formatted',
  },
  {
    content: 'terraform fmt -recursive',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Format files recursively',
  },

  // === State Management ===
  {
    content: 'terraform state list',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'List resources in state',
  },
  {
    content: 'terraform state show aws_instance.web',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Show a resource in state',
  },
  {
    content: 'terraform state rm aws_instance.web',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Remove a resource from state',
  },
  {
    content: 'terraform state mv aws_instance.old aws_instance.new',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Rename a resource in state',
  },
  {
    content: 'terraform import aws_instance.web i-1234567890',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Import existing infrastructure',
  },
  {
    content: 'terraform refresh',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Update state with real resources',
  },

  // === Workspaces ===
  {
    content: 'terraform workspace list',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'List workspaces',
  },
  {
    content: 'terraform workspace new dev',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Create a new workspace',
  },
  {
    content: 'terraform workspace select prod',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Switch to a workspace',
  },
  {
    content: 'terraform workspace delete staging',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Delete a workspace',
  },

  // === Other Commands ===
  {
    content: 'terraform output',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Show output values',
  },
  {
    content: 'terraform output -json',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Show outputs as JSON',
  },
  {
    content: 'terraform graph | dot -Tpng > graph.png',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Generate dependency graph',
  },
  {
    content: 'terraform taint aws_instance.web',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Mark resource for recreation',
  },
];

export async function seedTerraformChallenges() {
  console.log('Seeding Terraform challenges...');

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'terraform'))
    .limit(1);

  if (!category) {
    console.error('Error: Terraform category not found. Run db:seed first.');
    process.exit(1);
  }

  const challengeData = terraformChallenges.map((challenge) => ({
    ...challenge,
    categoryId: category.id,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${terraformChallenges.length} Terraform challenges.`);
}

if (require.main === module) {
  seedTerraformChallenges()
    .catch((error) => {
      console.error('Seed Terraform failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed Terraform finished. Exiting...');
      process.exit(0);
    });
}
