
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import CommandsList from './CommandsList'
import React from 'react'
import { Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Quote, Code, Minus } from 'lucide-react'

export default {
    items: ({ query }: { query: string }) => {
        return [
            {
                title: 'Título 1',
                description: 'Título grande de seção',
                icon: <Heading1 className="w-4 h-4" />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
                },
            },
            {
                title: 'Título 2',
                description: 'Título médio de seção',
                icon: <Heading2 className="w-4 h-4" />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
                },
            },
            {
                title: 'Lista de Tarefas',
                description: 'Rastreie tarefas com checkboxes',
                icon: <CheckSquare className="w-4 h-4" />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleTaskList().run()
                },
            },
            {
                title: 'Lista com Marcadores',
                description: 'Lista simples por tópicos',
                icon: <List className="w-4 h-4" />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleBulletList().run()
                },
            },
            {
                title: 'Lista Numerada',
                description: 'Lista ordenada por números',
                icon: <ListOrdered className="w-4 h-4" />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleOrderedList().run()
                },
            },
            {
                title: 'Citação',
                description: 'Destaque um texto ou fala',
                icon: <Quote className="w-4 h-4" />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleBlockquote().run()
                },
            },
            {
                title: 'Bloco de Código',
                description: 'Destaque código com sintaxe',
                icon: <Code className="w-4 h-4" />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
                },
            },
            {
                title: 'Linha Divisória',
                description: 'Separe seções visualmente',
                icon: <Minus className="w-4 h-4" />,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setHorizontalRule().run()
                },
            },
        ].filter(item => item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 8)
    },

    render: () => {
        let component: any
        let popup: any

        return {
            onStart: (props: any) => {
                component = new ReactRenderer(CommandsList, {
                    props,
                    editor: props.editor,
                })

                if (!props.clientRect) {
                    return
                }

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                })
            },

            onUpdate(props: any) {
                component.updateProps(props)

                if (!props.clientRect) {
                    return
                }

                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                })
            },

            onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                    popup[0].hide()
                    return true
                }

                return component.ref?.onKeyDown(props)
            },

            onExit() {
                popup[0].destroy()
                component.destroy()
            },
        }
    },
}
