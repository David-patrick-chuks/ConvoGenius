import { ResponsiveDialog } from "@/components/responsive-dialog";
import { MeetingForm } from "./meeting-form";
import { MeetingGetOne } from "../../types";

interface UpdateMeetingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialValues: MeetingGetOne;
};

export const UpdateMeetingDialog = ({ open, onOpenChange, initialValues }: UpdateMeetingDialogProps) => {
    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Edit Meeting"
            description="Edit meeting details."
        >
            <MeetingForm
                onSuccess={() => onOpenChange(false)}
                onCancel = {() => onOpenChange(false)}
                initialValues={initialValues}
            />
        </ResponsiveDialog>
    );
}