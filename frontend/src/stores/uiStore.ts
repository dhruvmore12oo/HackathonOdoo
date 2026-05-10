import { create } from 'zustand';

interface ModalState {
  id: string | null;
  props?: Record<string, unknown>;
}

interface UIState {
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  modal: ModalState;
  isGlobalLoading: boolean;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  openModal: (id: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;
  setGlobalLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  isMobileMenuOpen: false,
  modal: { id: null },
  isGlobalLoading: false,

  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
  openModal: (id, props) => set({ modal: { id, props } }),
  closeModal: () => set({ modal: { id: null } }),
  setGlobalLoading: (isGlobalLoading) => set({ isGlobalLoading }),
}));
