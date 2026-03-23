import { motion } from 'motion/react';
import {
	Terminal,
	Code,
	DollarSign,
	Clock,
	List,
	ArrowUpRight,
	type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';

const iconMap: Record<string, ComponentType<LucideProps>> = {
	terminal: Terminal,
	code: Code,
	'dollar-sign': DollarSign,
	clock: Clock,
	list: List,
	'arrow-up-right': ArrowUpRight,
};

interface AnimatedIconProps {
	name: string;
	className?: string;
}

export function AnimatedIcon({ name, className = 'size-5' }: AnimatedIconProps) {
	const Icon = iconMap[name];
	if (!Icon) return null;

	return (
		<motion.div
			whileHover={{ scale: 1.2, rotate: 5 }}
			transition={{ type: 'spring', stiffness: 400, damping: 15 }}
		>
			<Icon className={className} strokeWidth={2} />
		</motion.div>
	);
}
