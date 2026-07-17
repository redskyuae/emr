# Queue Token Resets Per Doctor Per Day

A Queue Token is allocated at Check-in from a counter keyed by Tenant, Doctor, and the Tenant-local date of the Visit, beginning at `1` and incrementing in Check-in order. Two Doctors consulting on the same day each have their own token 1; the same Doctor's tokens restart at 1 the next day.

This matches how outpatient departments actually call Patients — the token is spoken and displayed against one Doctor's queue, so a Tenant-wide running number would be meaningless to the Patient waiting outside a particular consulting room. The Visit Number (ADR 0028) remains the permanent, Tenant-unique reference; the Queue Token is the ordering number for one Doctor's day and is not an identifier.

The token date is the Tenant-local date at Check-in, resolved through the Tenant Time Zone under ADR 0026, so the day boundary follows the hospital's operational clock rather than the deployment server's.

Cancelling a Visit does not release its Queue Token, and the counter never rewinds. Reissuing a cancelled Patient's token to the next arrival was rejected because tokens are announced to Patients the moment they are issued; reusing a number that has already been called creates exactly the confusion the queue exists to prevent. Gaps in a day's token sequence are acceptable and readable as "that Patient left".
