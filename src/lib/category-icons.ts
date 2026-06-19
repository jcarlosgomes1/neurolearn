import {
  Code, BarChart3, Sparkles, Palette, Megaphone, Briefcase, LineChart, Zap,
  Sprout, Languages, Heart, Camera, PenLine, Image as ImageIcon, GraduationCap,
  Brain, Network, Wand2, Terminal, Bot, Eye, Server, Folder,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  'code': Code, 'bar-chart-3': BarChart3, 'sparkles': Sparkles, 'palette': Palette,
  'megaphone': Megaphone, 'briefcase': Briefcase, 'line-chart': LineChart, 'zap': Zap,
  'sprout': Sprout, 'languages': Languages, 'heart': Heart, 'camera': Camera,
  'pen-line': PenLine, 'image': ImageIcon, 'graduation-cap': GraduationCap, 'brain': Brain,
  'network': Network, 'wand-2': Wand2, 'terminal': Terminal, 'bot': Bot, 'eye': Eye, 'server': Server,
};

export function categoryIcon(name?: string | null): LucideIcon {
  return (name && MAP[name]) || Folder;
}
