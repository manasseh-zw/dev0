import { Store } from '@tanstack/react-store'
import type { PreviewOutput } from '@/lib/ai'

export type AppState = {
  previewData: PreviewOutput | null
  vibeInput: string
  isGeneratingPreview: boolean
  isCreatingProject: boolean
  currentProjectId: string | null
}

const initialState: AppState = {
  previewData: null,
  vibeInput: '',
  isGeneratingPreview: false,
  isCreatingProject: false,
  currentProjectId: null,
}


export const appStore = new Store<AppState>(initialState)

export const appActions = {
  setVibeInput: (vibeInput: string) => {
    appStore.setState((state) => ({
      ...state,
      vibeInput,
    }))
  },

  setGeneratingPreview: (isGeneratingPreview: boolean) => {
    appStore.setState((state) => ({
      ...state,
      isGeneratingPreview,
    }))
  },

  setPreviewData: (previewData: PreviewOutput) => {
    appStore.setState((state) => ({
      ...state,
      previewData,
      isGeneratingPreview: false,
    }))
  },

  setCreatingProject: (isCreatingProject: boolean) => {
    appStore.setState((state) => ({
      ...state,
      isCreatingProject,
    }))
  },

  setCurrentProjectId: (currentProjectId: string) => {
    appStore.setState((state) => ({
      ...state,
      currentProjectId,
      isCreatingProject: false,
    }))
  },

  clearPreview: () => {
    appStore.setState((state) => ({
      ...state,
      previewData: null,
      vibeInput: '',
    }))
  },

  reset: () => {
    appStore.setState(() => initialState)
  },
}
