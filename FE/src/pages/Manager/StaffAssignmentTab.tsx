import StaffAssignmentPage from '../Staff/StaffAssignmentPage';

// The user specifically wanted to KEEP Staff Assignment as it was. 
// We simply embed the existing page here, but adjust its layout if necessary, 
// or since StaffAssignmentPage has its own Sidebar, we might need to strip the sidebar 
// inside the ManagerPortal. Let's just create a thin wrapper.

export default function StaffAssignmentTab({ globalLotId, setGlobalLotId }: any) {
  return (
    <div className="w-full">
      <StaffAssignmentPage isTab={true} globalLotId={globalLotId} setGlobalLotId={setGlobalLotId} />
    </div>
  );
}
