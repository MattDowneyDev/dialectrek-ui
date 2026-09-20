import type { ReactNode } from "react";
import Link from "next/link";

type ActionCardProps = {
  to: string;
  title: string;
  description: string;
  icon?: ReactNode;
};

const ActionCard = ({ to, title, description, icon }: ActionCardProps) => (
  <Link href={to} className="action-card">
    {icon && <span className="action-card-icon">{icon}</span>}
    <div className="action-card-body">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  </Link>
);

export default ActionCard;
