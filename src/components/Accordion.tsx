"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDownIcon } from "./icons";

export type AccordionItem = {
  id: string;
  title: string;
  content: ReactNode;
};

type AccordionProps = {
  items: AccordionItem[];
  // id of the section that starts open -- omit to start fully collapsed
  defaultOpenId?: string;
};

// One section open at a time -- opening another closes the current one,
// and clicking the open one collapses it.
const Accordion = ({ items, defaultOpenId }: AccordionProps) => {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);
  const baseId = useId();

  return (
    <div className="accordion">
      {items.map((item) => {
        const isOpen = openId === item.id;
        const triggerId = `${baseId}-${item.id}-trigger`;
        const panelId = `${baseId}-${item.id}-panel`;
        return (
          <div
            key={item.id}
            className={`accordion-item${isOpen ? " accordion-item-open" : ""}`}
          >
            <h4 className="accordion-heading">
              <button
                type="button"
                id={triggerId}
                className="accordion-trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : item.id)}
              >
                {item.title}
                <ChevronDownIcon />
              </button>
            </h4>
            {/* stays mounted so the height can animate; inert keeps the
                collapsed content out of tab order and the a11y tree */}
            <div
              id={panelId}
              className="accordion-panel"
              role="region"
              aria-labelledby={triggerId}
              inert={!isOpen}
            >
              <div className="accordion-panel-clip">
                <div className="accordion-panel-inner">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
