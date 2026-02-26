import { Sidebar } from "./components/organisms/Sidebar";
import { ConfirmDialog } from "./components";
import { MainLayout } from "./components/templates";
import { ProfilePage, SettingsPage } from "./pages";
import { useAppController } from "./hooks";
function App() {
  const controller = useAppController();
  if (controller.profilesLoading || controller.settingsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-500"></div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading DockSwitcher...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout
      sidebar={
        <Sidebar
          profiles={controller.profiles}
          selectedProfileId={controller.selectedProfileId}
          activeProfileId={controller.activeProfileId}
          onSelectProfile={controller.handleSelectProfile}
          onCreateProfile={controller.handleCreateProfile}
          onDeleteProfile={controller.handleDeleteProfile}
          onRenameProfile={controller.handleRenameProfile}
          onReorderProfiles={controller.handleReorderProfiles}
          onOpenSettings={controller.handleOpenSettings}
        />
      }
    >
      {controller.showSettings ? (
        <SettingsPage
          settings={controller.settings}
          onUpdateSettings={controller.handleUpdateSettings}
          onBack={controller.handleBackFromSettings}
        />
      ) : (
        <ProfilePage
          profile={controller.selectedProfile}
          activeProfileId={controller.activeProfileId}
          dutiAvailable={controller.dutiAvailable}
          onApplyProfile={controller.handleApplyProfile}
          onSaveDock={controller.handleSaveDock}
          onAddApp={controller.handleAddApp}
          onRemoveApp={controller.handleRemoveApp}
          onReorderApps={controller.handleReorderApps}
          onUpdateProfile={controller.handleUpdateProfile}
        />
      )}
      <ConfirmDialog
        open={controller.confirmDialogState.open}
        title={controller.confirmDialogState.title}
        message={controller.confirmDialogState.message}
        confirmLabel={controller.confirmDialogState.confirmLabel}
        destructive={controller.confirmDialogState.isDelete}
        onConfirm={controller.handleConfirmDialogConfirm}
        onCancel={controller.handleConfirmDialogCancel}
      />
    </MainLayout>
  );
}

export { App };
