import { cn } from '../../../../lib/utils'

interface FilterTabsProps {
  active: 'All' | 'Unread' | 'Groups'
  onChange: (tab: 'All' | 'Unread' | 'Groups') => void
}

export function FilterTabs({ active, onChange }: FilterTabsProps) {
  const tabs: ('All' | 'Unread' | 'Groups')[] = ['All', 'Unread', 'Groups']

  return (
    <div className="flex px-3 pb-2 pt-2 gap-1 flex-shrink-0">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "px-3 py-1 text-xs rounded-full transition-colors",
            active === tab 
              ? "bg-accent text-accent-foreground font-medium" 
              : "text-text-secondary hover:bg-raised"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
