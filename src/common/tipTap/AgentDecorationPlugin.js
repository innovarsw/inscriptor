import { Extension, VueRenderer } from '@tiptap/vue-3';
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const AgentDecorationPlugin = Extension.create({
  name: 'agentDecoration',

  addOptions() {
    return {
      pendingClass: 'agent-pending',
      processingClass: 'agent-processing',
      streamingClass: 'agent-streaming',
      awaitingConfirmationClass: 'agent-awaiting-confirmation',
    }
  },

  addStorage() {
    return {
      pluginKey: new PluginKey('agentDecoration'),
      vueRenderers: new Map(), // Store VueRenderer instances for cleanup
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: this.storage.pluginKey,

        state: {
          init: (config, state) => {
            return DecorationSet.empty
          },

          apply: (transaction, decorationSet, oldState, newState) => {
            // Map existing decorations through the transaction
            decorationSet = decorationSet.map(transaction.mapping, transaction.doc)

            // Check for meta updates
            const meta = transaction.getMeta(this.storage.pluginKey)
            if (meta && meta.type === 'set') {
              return meta.decorationSet
            }

            return decorationSet
          }
        },

        props: {
          decorations: (state) => {
            return this.storage.pluginKey.getState(state)
          }
        }
      })
    ]
  },

  onDestroy() {
    // Cleanup all VueRenderer instances
    this.storage.vueRenderers.forEach(renderer => renderer.destroy())
    this.storage.vueRenderers.clear()
  },

  addCommands() {
    const pluginKey = this.storage.pluginKey
    const options = this.options
    const extension = this

    // Helper function to get CSS class based on status
    const getClassForStatus = (status) => {
      switch (status) {
        case 'pending':
          return options.pendingClass
        case 'processing':
          return options.processingClass
        case 'streaming':
          return options.streamingClass
        case 'awaiting_confirmation':
          return options.awaitingConfirmationClass
        default:
          return options.pendingClass
      }
    }

    // Helper function to create decorations
    const createDecoration = (from, to, status) => {
      const className = getClassForStatus(status)

      // Use node decoration for paragraph-level styling
      return Decoration.node(from, to, {
        class: className,
        'data-agent-status': status,
      })
    }

    return {
      addAgentDecoration: (from, to, status = 'pending') => ({ tr, dispatch, state }) => {
        if (!dispatch) return true

        const decoration = createDecoration(from, to, status)
        const currentDecorationSet = pluginKey.getState(state) || DecorationSet.empty
        const decorationSet = currentDecorationSet.add(state.doc, [decoration])

        const newTr = state.tr.setMeta(pluginKey, {
          type: 'set',
          decorationSet
        })

        dispatch(newTr)
        return true
      },

      updateAgentDecoration: (from, to, status) => ({ tr, dispatch, state }) => {
        if (!dispatch) return true

        let decorationSet = pluginKey.getState(state) || DecorationSet.empty

        // Find and remove existing decoration at this position
        const existingDecorations = decorationSet.find(from, to)
        if (existingDecorations.length > 0) {
          decorationSet = decorationSet.remove(existingDecorations)
        }

        // Add new decoration
        const decoration = createDecoration(from, to, status)
        decorationSet = decorationSet.add(state.doc, [decoration])

        const newTr = state.tr.setMeta(pluginKey, {
          type: 'set',
          decorationSet
        })

        dispatch(newTr)
        return true
      },

      removeAgentDecoration: (from, to) => ({ tr, dispatch, state }) => {
        if (!dispatch) return true

        let decorationSet = pluginKey.getState(state) || DecorationSet.empty

        // Find and remove decoration at this position
        const existingDecorations = decorationSet.find(from, to)
        if (existingDecorations.length > 0) {
          decorationSet = decorationSet.remove(existingDecorations)
        }

        const newTr = state.tr.setMeta(pluginKey, {
          type: 'set',
          decorationSet
        })

        dispatch(newTr)
        return true
      },

      clearAllAgentDecorations: () => ({ tr, dispatch, state }) => {
        if (!dispatch) return true

        const newTr = state.tr.setMeta(pluginKey, {
          type: 'set',
          decorationSet: DecorationSet.empty
        })

        dispatch(newTr)
        return true
      }
    }
  }
})
