
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Quote, Code, Minus } from 'lucide-react'

const CommandsList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = (index: number) => {
        const item = props.items[index]
        if (item) {
            props.command(item)
        }
    }

    useEffect(() => setSelectedIndex(0), [props.items])

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
                return true
            }

            if (event.key === 'ArrowDown') {
                setSelectedIndex((selectedIndex + 1) % props.items.length)
                return true
            }

            if (event.key === 'Enter') {
                selectItem(selectedIndex)
                return true
            }

            return false
        },
    }))

    return (
        <div className="bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-2 min-w-[220px] backdrop-blur-3xl">
            {props.items.length ? (
                <div className="flex flex-col gap-1">
                    {props.items.map((item: any, index: number) => (
                        <button
                            key={index}
                            onClick={() => selectItem(index)}
                            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all
                ${index === selectedIndex ? 'bg-white text-black' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}
              `}
                        >
                            <div className={`
                p-2 rounded-lg border
                ${index === selectedIndex ? 'bg-black/10 border-black/10' : 'bg-white/5 border-white/10'}
              `}>
                                {item.icon}
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest">{item.title}</p>
                                <p className={`text-[9px] font-bold ${index === selectedIndex ? 'text-black/60' : 'text-zinc-600'}`}>
                                    {item.description}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="px-4 py-3 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                    Nenhum comando encontrado
                </div>
            )}
        </div>
    )
})

CommandsList.displayName = 'CommandsList'

export default CommandsList
