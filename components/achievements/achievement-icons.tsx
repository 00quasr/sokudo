'use client';

import {
  Gauge,
  Zap,
  Flame,
  GitBranch,
  GitMerge,
  Terminal,
  Code,
  FileType,
  Container,
  Package,
  Layers,
  Sparkles,
  Database,
  Trophy,
  Target,
  Award,
  type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';

const iconMap: Record<string, ComponentType<LucideProps>> = {
  gauge: Gauge,
  zap: Zap,
  flame: Flame,
  'git-branch': GitBranch,
  'git-merge': GitMerge,
  terminal: Terminal,
  code: Code,
  'file-type': FileType,
  container: Container,
  package: Package,
  layers: Layers,
  sparkles: Sparkles,
  database: Database,
  trophy: Trophy,
  target: Target,
};

export function AchievementIcon({
  icon,
  ...props
}: { icon: string } & LucideProps) {
  const IconComponent = iconMap[icon] ?? Award;
  return <IconComponent {...props} />;
}
