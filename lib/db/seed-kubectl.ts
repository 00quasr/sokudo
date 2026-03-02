import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * kubectl challenges for Kubernetes management
 *
 * 30 challenges covering:
 * - Basic operations (get, describe, delete)
 * - Deployments and pods
 * - Services and configs
 * - Debugging and logs
 */
export const kubectlChallenges = [
  // === Basic Get Commands ===
  {
    content: 'kubectl get pods',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List all pods in current namespace',
  },
  {
    content: 'kubectl get nodes',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List all nodes in the cluster',
  },
  {
    content: 'kubectl get services',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List all services',
  },
  {
    content: 'kubectl get deployments',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List all deployments',
  },
  {
    content: 'kubectl get all',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List all resources in namespace',
  },
  {
    content: 'kubectl get pods -A',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'List pods across all namespaces',
  },
  {
    content: 'kubectl get pods -o wide',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'List pods with additional info',
  },
  {
    content: 'kubectl get pods -o yaml',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Output pods as YAML',
  },

  // === Describe and Logs ===
  {
    content: 'kubectl describe pod nginx',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Show detailed info about a pod',
  },
  {
    content: 'kubectl logs nginx',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'View pod logs',
  },
  {
    content: 'kubectl logs -f nginx',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Follow pod logs in real-time',
  },
  {
    content: 'kubectl logs nginx --previous',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'View logs from previous container',
  },
  {
    content: 'kubectl logs nginx -c app',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'View logs from specific container',
  },

  // === Create and Apply ===
  {
    content: 'kubectl apply -f deployment.yaml',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Apply a configuration file',
  },
  {
    content: 'kubectl create deployment nginx --image=nginx',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Create a deployment imperatively',
  },
  {
    content: 'kubectl create namespace dev',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Create a new namespace',
  },
  {
    content: 'kubectl apply -f . --recursive',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Apply all configs in directory tree',
  },

  // === Delete ===
  {
    content: 'kubectl delete pod nginx',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Delete a specific pod',
  },
  {
    content: 'kubectl delete -f deployment.yaml',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Delete resources from a file',
  },
  {
    content: 'kubectl delete pods --all',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Delete all pods in namespace',
  },

  // === Exec and Debug ===
  {
    content: 'kubectl exec -it nginx -- /bin/bash',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Open interactive shell in pod',
  },
  {
    content: 'kubectl exec nginx -- cat /etc/hosts',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Run command in pod',
  },
  {
    content: 'kubectl port-forward pod/nginx 8080:80',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Forward local port to pod',
  },

  // === Scaling and Updates ===
  {
    content: 'kubectl scale deployment nginx --replicas=3',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Scale a deployment',
  },
  {
    content: 'kubectl rollout status deployment/nginx',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Check rollout status',
  },
  {
    content: 'kubectl rollout undo deployment/nginx',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Rollback a deployment',
  },
  {
    content: 'kubectl set image deployment/nginx nginx=nginx:1.19',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Update container image',
  },

  // === Context and Config ===
  {
    content: 'kubectl config get-contexts',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List available contexts',
  },
  {
    content: 'kubectl config use-context prod',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Switch to a different context',
  },
  {
    content: 'kubectl config current-context',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Show current context',
  },
];

export async function seedKubectlChallenges() {
  console.log('Seeding kubectl challenges...');

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'kubectl'))
    .limit(1);

  if (!category) {
    console.error('Error: kubectl category not found. Run db:seed first.');
    process.exit(1);
  }

  const challengeData = kubectlChallenges.map((challenge) => ({
    ...challenge,
    categoryId: category.id,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${kubectlChallenges.length} kubectl challenges.`);
}

if (require.main === module) {
  seedKubectlChallenges()
    .catch((error) => {
      console.error('Seed kubectl failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed kubectl finished. Exiting...');
      process.exit(0);
    });
}
