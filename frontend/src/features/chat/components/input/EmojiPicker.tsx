import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

type EmojiCategory = {
  id: string
  label: string
  icon: string
  emojis: string[]
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'all',
    label: 'All',
    icon: '🧩',
    emojis: [],
  },
  {
    id: 'smileys',
    label: 'Smileys',
    icon: '😀',
    emojis: [
      '😀','😃','😄','😁','😆','😅','😂','🤣','🥲','😊','😇','🙂','🙃','😉','😍','🥰','😘','😗','😙','😚',
      '😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️',
      '😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓',
      '🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴',
      '🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👻','💀','☠️','👽','🤖','💩','🎃'
    ],
  },
  {
    id: 'people',
    label: 'People',
    icon: '🧑',
    emojis: [
      '👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🫶','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍',
      '👎','✊','👊','🤛','🤜','👏','🙌','👐','🤝','🙏','💪','🦵','🦶','👂','👃','🧠','🫀','🫁','👀','👁️',
      '👶','🧒','👦','👧','🧑','👨','👩','🧔','👱','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦',
      '🤷','👨‍⚕️','👩‍⚕️','👨‍🎓','👩‍🎓','👨‍🏫','👩‍🏫','👨‍💻','👩‍💻','👨‍🍳','👩‍🍳','👨‍🎤','👩‍🎤','👨‍🚀','👩‍🚀','👨‍🚒','👩‍🚒'
    ],
  },
  {
    id: 'animals',
    label: 'Animals',
    icon: '🐶',
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔',
      '🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🪲',
      '🐢','🐍','🦎','🦂','🦀','🐙','🦑','🦐','🦞','🐠','🐟','🐬','🦈','🐳','🐋','🐊','🐆','🦓','🦍','🦧'
    ],
  },
  {
    id: 'food',
    label: 'Food',
    icon: '🍔',
    emojis: [
      '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑',
      '🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🫚','🥐','🥖','🍞','🥨','🥯','🧇','🥞',
      '🧀','🍖','🍗','🥩','🥓','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🫔','🥙','🧆','🥚','🍳','🥘','🍲','🫕',
      '🥗','🍿','🧈','🧂','🍱','🍣','🍤','🍙','🍚','🍜','🍝','🍛','🍢','🍡','🍧','🍨','🍦','🥧','🍰','🎂',
      '🍮','🍭','🍬','🍫','🍿','☕','🍵','🧃','🥤','🧋','🍺','🍻','🍷','🥂','🥃','🍸','🍹','🧉','🍾','🥛'
    ],
  },
  {
    id: 'celebrations',
    label: 'Celebrations',
    icon: '🎉',
    emojis: [
      '🎉','🎊','🎈','🎂','🍰','🕯️','🥳','🎁','🪅','🎄','🎃','🧧','🎆','🎇','✨','🎯','🎵','🎶','🎤','🎧',
      '🎸','🎹','🥁','🎺','🎻','🎲','🎮','🕹️','🎭','🎨','🎬','🏆','🥇','🥈','🥉','⚽','🏀','🏈','🎾','🏐',
      '🏓','🏸','🥊','🥋','🎳','⛳','🏹','🛼','⛸️','🎿','🏂','🏋️','🤸','⛹️','🤾','🏌️','🏇','🚴','🏊','🧘'
    ],
  },
  {
    id: 'travel-places',
    label: 'Travel & Homes',
    icon: '🏠',
    emojis: [
      '🏠','🏡','🏘️','🏚️','🏢','🏬','🏣','🏤','🏥','🏦','🏨','🏪','🏫','🏛️','⛪','🕌','🛕','🕍','⛩️','🕋',
      '⛲','⛺','🌁','🌃','🏙️','🌄','🌅','🌆','🌇','🌉','🎠','🎡','🎢','🚂','🚆','🚇','🚊','🚉','✈️','🛫',
      '🛬','🚀','🛸','🚁','🚢','⛵','🚤','🛥️','🚗','🚕','🚙','🚌','🚓','🚑','🚒','🚚','🚛','🚜','🛵','🏍️',
      '🗺️','🧭','⛰️','🏔️','🗻','🌋','🏝️','🏖️','🌊','🏞️','🌳','🌲','🌵','🏜️','🏕️'
    ],
  },
  {
    id: 'objects',
    label: 'Objects',
    icon: '💡',
    emojis: [
      '⌚','📱','💻','⌨️','🖥️','🖨️','🖱️','💽','💾','📷','📸','🎥','📹','📞','☎️','📺','📻','🎙️','🎚️','⏰',
      '⏱️','🔋','🔌','💡','🔦','🕯️','🧯','🧰','🔧','🔨','⚙️','⛓️','🧲','🧪','🧫','🧬','💊','🩹','🩺','🧹',
      '🧺','🧻','🚿','🛁','🛒','🎒','👜','💼','👓','🕶️','🥽','🧢','👑','💍','💎','📎','✂️','📌','📍','🔒',
      '🔑','🪪','💰','💳','🧾','📦','📫','📬','✉️','📨','📩','📝','📚','📖','🗂️','📁','📅','📌'
    ],
  },
  {
    id: 'symbols',
    label: 'Symbols',
    icon: '❤️',
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️',
      '✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐',
      '♑','♒','♓','⚛️','🆔','⚠️','🚫','✅','❌','⭕','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','➕',
      '➖','➗','✖️','♾️','💯','🔁','🔂','▶️','⏸️','⏹️','⏺️','⬆️','⬇️','⬅️','➡️','↔️','↕️','↩️','↪️'
    ],
  },
  {
    id: 'flags',
    label: 'Flags',
    icon: '🏳️',
    emojis: [
      '🏳️','🏴','🏁','🚩','🏳️‍🌈','🏳️‍⚧️','🇺🇳','🇺🇸','🇬🇧','🇵🇰','🇮🇳','🇧🇩','🇦🇪','🇸🇦','🇶🇦','🇹🇷','🇩🇪','🇫🇷','🇮🇹','🇪🇸',
      '🇵🇹','🇳🇱','🇧🇪','🇨🇭','🇸🇪','🇳🇴','🇫🇮','🇩🇰','🇵🇱','🇨🇿','🇦🇹','🇭🇺','🇷🇺','🇺🇦','🇨🇦','🇲🇽','🇧🇷','🇦🇷','🇨🇱','🇯🇵',
      '🇨🇳','🇰🇷','🇲🇾','🇸🇬','🇮🇩','🇹🇭','🇻🇳','🇵🇭','🇦🇺','🇳🇿','🇿🇦','🇪🇬','🇳🇬','🇰🇪','🇲🇦','🇩🇿'
    ],
  },
]

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState('smileys')
  const [query, setQuery] = useState('')

  const allEmojis = useMemo(
    () => EMOJI_CATEGORIES.filter((category) => category.id !== 'all').flatMap((category) => category.emojis),
    []
  )

  const visibleEmojis = useMemo(() => {
    const source = activeCategory === 'all'
      ? allEmojis
      : EMOJI_CATEGORIES.find((category) => category.id === activeCategory)?.emojis || []

    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return source

    // Query works with category labels as well as emoji glyph typing.
    return source.filter((emoji) => {
      const category = EMOJI_CATEGORIES.find((item) => item.emojis.includes(emoji))
      return Boolean(category?.label.toLowerCase().includes(normalizedQuery) || emoji.includes(normalizedQuery))
    })
  }, [activeCategory, allEmojis, query])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: 'transform, opacity' }}
      className="fixed left-2 right-2 bottom-24 sm:absolute sm:left-0 sm:right-auto sm:bottom-full sm:mb-4 bg-surface/95 backdrop-blur rounded-2xl shadow-xl border border-border sm:w-84 h-96 flex flex-col origin-bottom-left z-50"
    >
      <div className="p-3 border-b border-border font-medium text-sm text-text-secondary flex items-center justify-between">
        <span>Emojis</span>
        <button
          type="button"
          onClick={onClose}
          className="sm:hidden p-1 rounded-md hover:bg-raised text-text-secondary hover:text-foreground"
          aria-label="Close emoji picker"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-3 pt-2 pb-2 border-b border-border">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search emoji"
            className="w-full h-8 rounded-lg border border-border bg-raised pl-8 pr-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="px-2 py-2 border-b border-border overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {EMOJI_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
                activeCategory === category.id
                  ? 'bg-foreground text-surface'
                  : 'text-text-secondary hover:bg-raised hover:text-foreground'
              }`}
              title={category.label}
              aria-label={category.label}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-8 gap-1">
        {visibleEmojis.map((emoji, index) => (
          <button 
            key={`${emoji}-${index}`}
            onClick={() => onSelect(emoji)}
            className="h-8 w-8 flex items-center justify-center hover:bg-raised rounded text-lg transition-colors cursor-pointer"
          >
            {emoji}
          </button>
        ))}
        {visibleEmojis.length === 0 && (
          <p className="col-span-8 text-center text-xs text-text-tertiary py-6">No emojis found for this search.</p>
        )}
      </div>
    </motion.div>
  )
}
